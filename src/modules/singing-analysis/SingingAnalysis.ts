/**
 * SingingAnalysis – core class that manages microphone capture and real-time
 * pitch analysis using the Web Audio API.
 *
 * Usage
 * -----
 *   const analysis = new SingingAnalysis()
 *
 *   await analysis.startAnalysis(
 *     {
 *       onPitchSample: sample => console.log(sample),
 *       onError: msg => console.error(msg),
 *     },
 *     // Optional: expected notes for pitch-accuracy + timing scoring
 *     [{ time: 1.0, note: 440 }, { time: 1.5, note: 493.88 }],
 *   )
 *
 *   // … later …
 *   analysis.stopAnalysis()
 *   console.log('Final score:', analysis.getScore())
 *
 * Design notes
 * ------------
 * - The class is intentionally stateless with respect to Redux; it fires
 *   callbacks and the React component maps those to Redux dispatches.
 * - A single AnalyserNode is connected to the raw microphone stream; the
 *   microphone signal is *not* routed to any audio output (speakers), so the
 *   user does not hear their own voice fed back.
 * - Analysis runs on a fixed timer rather than requestAnimationFrame so that
 *   it continues even when the browser tab is in the background.
 * - When `songMetadata` is provided to `startAnalysis`, timing accuracy is
 *   computed alongside pitch accuracy and blended into the final score
 *   (pitch × 70% + timing × 30%).
 */

import {
  detectPitch,
  frequencyToNoteName,
  getCentsDeviation,
} from './pitchDetection'
import { calculateScore } from './scoringSystem'
import { analyzeTimings, findNearestMetadata } from './timingAnalyzer'
import type {
  PitchSample,
  SingingAnalysisCallbacks,
  SongNote,
  TimingPair,
} from './types'
import type { ScoreBreakdown } from './scoringSystem'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Number of PCM samples fed to the pitch detector per frame. */
const BUFFER_SIZE = 2048

/** Milliseconds between analysis frames (~10 fps). */
const ANALYSIS_INTERVAL_MS = 100

/** Maximum number of frames retained for internal score calculation. */
const MAX_HISTORY_FRAMES = 200

// ---------------------------------------------------------------------------
// SingingAnalysis class
// ---------------------------------------------------------------------------

class SingingAnalysis {
  private audioCtx: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private micSourceNode: MediaStreamAudioSourceNode | null = null
  private micStream: MediaStream | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private callbacks: SingingAnalysisCallbacks | null = null
  private frameHistory: PitchSample[] = []

  // Timing-related state (populated when songMetadata is provided)
  private songMetadata: SongNote[] = []
  private timingPairs: TimingPair[] = []
  private sessionStartMs: number | null = null

  /** True while the microphone is actively capturing audio. */
  isAnalyzing = false

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Request microphone access and start real-time pitch analysis.
   *
   * Resolves once the audio graph is ready and the analysis loop has started.
   * If the microphone permission is denied or any other error occurs, the
   * `onError` callback is invoked and the method resolves (not rejects) so
   * that callers do not need to add a `.catch()` handler.
   *
   * Calling `startAnalysis` while already analysing is a no-op.
   *
   * @param callbacks     - Event callbacks for pitch samples and errors.
   * @param songMetadata  - Optional array of expected note events.  When
   *                        supplied, timing accuracy is tracked and blended
   *                        into the final score (pitch × 70% + timing × 30%).
   */
  async startAnalysis (
    callbacks: SingingAnalysisCallbacks,
    songMetadata: SongNote[] = [],
  ): Promise<void> {
    if (this.isAnalyzing) return

    this.callbacks = callbacks
    this.songMetadata = Array.isArray(songMetadata) ? songMetadata : []
    this.timingPairs = []
    this.sessionStartMs = null

    try {
      // ── Microphone access ─────────────────────────────────────────────────
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      // ── Audio graph: mic → analyser (not connected to speakers) ──────────
      this.audioCtx = new AudioContext()
      this.analyserNode = this.audioCtx.createAnalyser()
      this.analyserNode.fftSize = BUFFER_SIZE * 2
      // Disable smoothing so each frame reflects the current signal directly
      this.analyserNode.smoothingTimeConstant = 0

      this.micSourceNode = this.audioCtx.createMediaStreamSource(this.micStream)
      this.micSourceNode.connect(this.analyserNode)
      // Intentionally NOT connecting analyserNode → audioCtx.destination
      // to avoid microphone feedback.

      // ── Start analysis loop ───────────────────────────────────────────────
      this.isAnalyzing = true
      this.frameHistory = []
      this.sessionStartMs = Date.now()
      this.intervalId = setInterval(
        () => this.analyseFrame(),
        ANALYSIS_INTERVAL_MS,
      )
    } catch (err) {
      this.cleanup()
      const message = err instanceof Error ? err.message : 'Microphone access failed'
      callbacks.onError(message)
    }
  }

  /**
   * Stop the analysis loop and release all audio resources (including the
   * microphone stream so the browser's recording indicator disappears).
   */
  stopAnalysis (): void {
    this.cleanup()
  }

  /**
   * Return the current performance score breakdown calculated from all frames
   * captured since the last `startAnalysis` call.
   *
   * The breakdown can be retrieved at any time, including after `stopAnalysis`.
   *
   * When `songMetadata` was supplied to `startAnalysis`, the `timingAccuracy`
   * field is populated and the `score` reflects the combined formula
   * (pitch × 70% + timing × 30%).
   */
  getScore (): ScoreBreakdown {
    const timingAccuracy = this.timingPairs.length > 0
      ? analyzeTimings(this.timingPairs)
      : null
    return calculateScore(this.frameHistory, timingAccuracy)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private analyseFrame (): void {
    if (!this.analyserNode || !this.audioCtx) return

    const now = Date.now()
    const buffer = new Float32Array(BUFFER_SIZE)
    this.analyserNode.getFloatTimeDomainData(buffer)

    const frequency = detectPitch(buffer, this.audioCtx.sampleRate)

    // ── Resolve expected frequency and timing for this frame ─────────────────
    let expectedFrequency: number | undefined
    let nearestNote = null

    if (this.songMetadata.length > 0 && this.sessionStartMs !== null) {
      const elapsedSeconds = (now - this.sessionStartMs) / 1000
      nearestNote = findNearestMetadata(this.songMetadata, elapsedSeconds)
      if (nearestNote != null) {
        expectedFrequency = nearestNote.note
      }
    }

    const sample: PitchSample = {
      timestamp: now,
      frequency,
      noteName: frequency != null ? frequencyToNoteName(frequency) : null,
      cents: frequency != null ? getCentsDeviation(frequency) : null,
      ...(expectedFrequency != null ? { expectedFrequency } : {}),
    }

    // ── Track timing pair when a voiced frame has a matching metadata note ───
    if (frequency != null && nearestNote != null && this.sessionStartMs !== null) {
      const expectedMs = this.sessionStartMs + nearestNote.time * 1000
      this.timingPairs.push({ userTimestamp: now, expectedTimestamp: expectedMs })
    }

    // Keep a rolling history for getScore()
    if (this.frameHistory.length >= MAX_HISTORY_FRAMES) {
      this.frameHistory.shift()
    }
    this.frameHistory.push(sample)

    this.callbacks?.onPitchSample(sample)
  }

  private cleanup (): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.micSourceNode?.disconnect()
    this.micSourceNode = null

    this.micStream?.getTracks().forEach(t => t.stop())
    this.micStream = null

    this.analyserNode?.disconnect()
    this.analyserNode = null

    this.audioCtx?.close()
    this.audioCtx = null

    this.isAnalyzing = false
    this.callbacks = null
    this.sessionStartMs = null
  }
}

export default SingingAnalysis
