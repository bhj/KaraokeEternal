/**
 * SingingAnalysis – core class that manages microphone capture and real-time
 * pitch analysis using the Web Audio API.
 *
 * Usage
 * -----
 *   const analysis = new SingingAnalysis()
 *
 *   await analysis.startAnalysis({
 *     onPitchSample: sample => console.log(sample),
 *     onError: msg => console.error(msg),
 *   })
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
 */

import {
  detectPitch,
  frequencyToNoteName,
  getCentsDeviation,
} from './pitchDetection'
import { calculateScore } from './scoringSystem'
import type { PitchSample, SingingAnalysisCallbacks } from './types'

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
   */
  async startAnalysis (callbacks: SingingAnalysisCallbacks): Promise<void> {
    if (this.isAnalyzing) return

    this.callbacks = callbacks

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
   * Return the current performance score (0–100) calculated from all frames
   * captured since the last `startAnalysis` call.
   *
   * The score can be called at any time, including after `stopAnalysis`.
   */
  getScore (): number {
    return calculateScore(this.frameHistory).score
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private analyseFrame (): void {
    if (!this.analyserNode || !this.audioCtx) return

    const buffer = new Float32Array(BUFFER_SIZE)
    this.analyserNode.getFloatTimeDomainData(buffer)

    const frequency = detectPitch(buffer, this.audioCtx.sampleRate)

    const sample: PitchSample = {
      timestamp: Date.now(),
      frequency,
      noteName: frequency != null ? frequencyToNoteName(frequency) : null,
      cents: frequency != null ? getCentsDeviation(frequency) : null,
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
  }
}

export default SingingAnalysis
