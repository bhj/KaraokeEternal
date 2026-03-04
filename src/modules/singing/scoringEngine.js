/**
 * Scoring Engine Module – real-time performance scoring.
 *
 * Combines pitch accuracy and timing accuracy into a single 0–100 score using
 * a weighted formula:
 *
 *   finalScore = (pitchAccuracy × 0.7) + (timingAccuracy × 0.3)
 *
 * The engine is designed as a class so that multiple independent sessions
 * (e.g. a duet) can run concurrently without shared state.
 *
 * Song Metadata Format
 * --------------------
 * The `songMetadata` parameter passed to `startScoring()` is an array of
 * expected note events:
 *
 *   [
 *     { time: 2.3,  note: 440  },   // time in seconds from song start
 *     { time: 2.8,  note: 493.88 },
 *     …
 *   ]
 *
 * The `note` field is the expected fundamental frequency in Hz (not a MIDI
 * number or note name string).  If the array is empty or not supplied, pitch
 * and timing accuracy fall back to presence-only scoring (was the user
 * actively singing?).
 *
 * API
 * ---
 *   engine.startScoring(songMetadata)         – begin a new session
 *   engine.processVoiceInput(pitch, timestamp) – feed one detection result
 *   engine.stopScoring()                       – end the session
 *   engine.getScore()                          – retrieve the current score
 *
 * getScore() returns:
 *   {
 *     pitchAccuracy:  82,   // integer 0–100
 *     timingAccuracy: 78,   // integer 0–100
 *     finalScore:     80,   // integer 0–100
 *   }
 *
 * Usage
 * -----
 *   import { ScoringEngine } from './scoringEngine.js'
 *
 *   const engine = new ScoringEngine()
 *   engine.startScoring(songMetadata)
 *
 *   // In your analysis loop:
 *   engine.processVoiceInput(detectedPitch, Date.now())
 *
 *   // At session end:
 *   engine.stopScoring()
 *   console.log(engine.getScore())
 *   // → { pitchAccuracy: 82, timingAccuracy: 78, finalScore: 80 }
 */

import { analyzeTimings, findNearestMetadata } from './timingAnalyzer.js'

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

/** Weight applied to pitch accuracy in the final score formula. */
const PITCH_WEIGHT = 0.7

/** Weight applied to timing accuracy in the final score formula. */
const TIMING_WEIGHT = 0.3

// ---------------------------------------------------------------------------
// Pitch comparison
// ---------------------------------------------------------------------------

/** Concert pitch: A4 = 440 Hz. */
const A4_FREQUENCY = 440

/** MIDI note number for A4. */
const A4_MIDI = 69

/**
 * Maximum MIDI-note distance (in semitones) between the detected pitch and
 * the expected pitch to be counted as "in tune".
 *
 * 0.5 semitones ≈ ±50 cents, matching the tolerance used in the wider codebase.
 */
const IN_TUNE_SEMITONE_TOLERANCE = 0.5

// ---------------------------------------------------------------------------
// Helper: frequency → MIDI note (continuous, not rounded)
// ---------------------------------------------------------------------------

/**
 * Convert a frequency in Hz to a continuous MIDI note number.
 *
 * @param {number} frequency - Frequency in Hz.
 * @returns {number} MIDI note number (may be fractional).
 */
function freqToMidiContinuous (frequency) {
  return 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI
}

// ---------------------------------------------------------------------------
// ScoringEngine class
// ---------------------------------------------------------------------------

export class ScoringEngine {
  constructor () {
    /** @type {Array<{ time: number, note: number }>} */
    this._metadata   = []
    /** @type {Array<{ pitch: number|null, timestamp: number }>} */
    this._inputs     = []
    this._isActive   = false
    /** @type {number|null} Wall-clock time when startScoring() was called. */
    this._startTime  = null
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Begin a new scoring session.
   *
   * Clears any previous session data.  Call this when a song starts or when
   * the user presses "Start" in the UI.
   *
   * @param {Array<{ time: number, note: number }>} [songMetadata=[]]
   *   Expected note events for the current song.  Pass an empty array (or
   *   omit) to score presence-only without pitch/timing comparison.
   */
  startScoring (songMetadata = []) {
    this._metadata  = Array.isArray(songMetadata) ? songMetadata : []
    this._inputs    = []
    this._isActive  = true
    this._startTime = Date.now()
  }

  /**
   * Submit one pitch detection result from the microphone analysis loop.
   *
   * @param {number|null} pitch     - Detected frequency in Hz, or null (silence).
   * @param {number}      timestamp - Wall-clock timestamp in ms (Date.now()).
   */
  processVoiceInput (pitch, timestamp) {
    if (!this._isActive) return
    this._inputs.push({ pitch: pitch ?? null, timestamp })
  }

  /**
   * Mark the session as complete.  `getScore()` can still be called after
   * stopping to retrieve the final score.
   */
  stopScoring () {
    this._isActive = false
  }

  /**
   * Calculate and return the current performance score.
   *
   * Can be called at any time (including while the session is still running).
   *
   * @returns {{ pitchAccuracy: number, timingAccuracy: number, finalScore: number }}
   *   All values are integers in the range 0–100.
   *
   * @example
   *   engine.getScore()
   *   // → { pitchAccuracy: 82, timingAccuracy: 78, finalScore: 80 }
   */
  getScore () {
    if (this._inputs.length === 0) {
      return { pitchAccuracy: 0, timingAccuracy: 0, finalScore: 0 }
    }

    const pitchAccuracy  = this._computePitchAccuracy()
    const timingAccuracy = this._computeTimingAccuracy()
    const finalScore     = (pitchAccuracy * PITCH_WEIGHT) + (timingAccuracy * TIMING_WEIGHT)

    return {
      pitchAccuracy:  Math.round(pitchAccuracy  * 100),
      timingAccuracy: Math.round(timingAccuracy * 100),
      finalScore:     Math.round(finalScore     * 100),
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Compute pitch accuracy as a fraction in [0, 1].
   *
   * When no song metadata is available: fraction of frames where singing was
   * detected (presence ratio).
   *
   * When metadata is available: fraction of frames where the detected pitch
   * is within IN_TUNE_SEMITONE_TOLERANCE semitones of the expected note.
   *
   * @returns {number} 0–1
   */
  _computePitchAccuracy () {
    const voiced = this._inputs.filter(i => i.pitch != null)

    if (voiced.length === 0) return 0

    // No expected-note data: reward singing presence
    if (this._metadata.length === 0) {
      return voiced.length / this._inputs.length
    }

    let inTuneCount = 0
    let comparedCount = 0

    for (const { pitch, timestamp } of voiced) {
      const elapsed  = (timestamp - this._startTime) / 1000
      const expected = findNearestMetadata(this._metadata, elapsed)
      if (expected == null) continue

      comparedCount++
      const userMidi     = freqToMidiContinuous(pitch)
      const expectedMidi = freqToMidiContinuous(expected.note)

      if (Math.abs(userMidi - expectedMidi) <= IN_TUNE_SEMITONE_TOLERANCE) {
        inTuneCount++
      }
    }

    return comparedCount > 0 ? inTuneCount / comparedCount : 0
  }

  /**
   * Compute timing accuracy as a fraction in [0, 1].
   *
   * Pairs each voiced input with the nearest metadata event and delegates
   * to `analyzeTimings()` from the timingAnalyzer module.
   *
   * @returns {number} 0–1
   */
  _computeTimingAccuracy () {
    if (this._metadata.length === 0 || this._startTime == null) return 0

    /** @type {Array<{ userTimestamp: number, expectedTimestamp: number }>} */
    const pairs = []

    for (const { pitch, timestamp } of this._inputs) {
      if (pitch == null) continue

      const elapsed  = (timestamp - this._startTime) / 1000
      const nearest  = findNearestMetadata(this._metadata, elapsed)
      if (nearest == null) continue

      const expectedTimestamp = this._startTime + nearest.time * 1000
      pairs.push({ userTimestamp: timestamp, expectedTimestamp })
    }

    return analyzeTimings(pairs)
  }
}
