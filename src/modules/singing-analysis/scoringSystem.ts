/**
 * Scoring System – evaluates singing performance from a series of pitch frames.
 *
 * Score is expressed as an integer in the range 0–100 and is computed from two
 * components:
 *
 *   1. **Pitch-presence ratio** – fraction of frames where a clear note was
 *      detected (singer is actively singing / not silent).
 *
 *   2. **Pitch-accuracy ratio** – when expected frequencies are provided (e.g.
 *      from a MIDI source), fraction of "singing" frames where the detected
 *      pitch is within an acceptable tolerance of the expected note.
 *
 * When no expected frequencies are available the score equals the
 * pitch-presence ratio alone (i.e. we reward singing continuously).
 *
 * Pure functions only – no side-effects.
 */

import type { PitchSample } from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cents tolerance within which a pitch is considered "in tune". */
const IN_TUNE_THRESHOLD_CENTS = 50

/**
 * Weight assigned to pitch presence when expected pitches are available.
 * The remaining weight goes to pitch accuracy.
 */
const PRESENCE_WEIGHT = 0.3
const ACCURACY_WEIGHT = 1 - PRESENCE_WEIGHT

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Intermediate result broken down by component for debugging / UI display. */
export interface ScoreBreakdown {
  /** Overall score 0–100. */
  score: number
  /** Fraction of frames where singing was detected (0–1). */
  presenceRatio: number
  /**
   * Fraction of "in-tune" frames among frames that had an expected pitch.
   * `null` when no expected-pitch data was supplied.
   */
  accuracyRatio: number | null
  totalFrames: number
}

/**
 * Calculate a performance score from an array of pitch samples.
 *
 * @param samples - History of pitch measurements (typically the last N frames).
 * @returns Breakdown object containing the overall score and sub-metrics.
 */
export function calculateScore (samples: PitchSample[]): ScoreBreakdown {
  const totalFrames = samples.length

  if (totalFrames === 0) {
    return { score: 0, presenceRatio: 0, accuracyRatio: null, totalFrames: 0 }
  }

  // Count frames where a pitch was detected
  const presenceFrames = samples.filter(s => s.frequency !== null).length
  const presenceRatio = presenceFrames / totalFrames

  // Check whether any sample has an expected frequency
  const samplesWithExpected = samples.filter(
    s => s.expectedFrequency != null && s.frequency != null,
  )

  let accuracyRatio: number | null = null
  let score: number

  if (samplesWithExpected.length > 0) {
    const inTuneFrames = samplesWithExpected.filter((s) => {
      if (s.cents == null || s.expectedFrequency == null || s.frequency == null) return false
      // Compare detected pitch to expected pitch (not just nearest note)
      const expectedMidi = Math.round(12 * Math.log2(s.expectedFrequency / 440) + 69)
      const detectedMidi = Math.round(12 * Math.log2(s.frequency / 440) + 69)
      if (expectedMidi !== detectedMidi) return false
      return Math.abs(s.cents) <= IN_TUNE_THRESHOLD_CENTS
    }).length

    accuracyRatio = inTuneFrames / samplesWithExpected.length
    score = Math.round(
      (presenceRatio * PRESENCE_WEIGHT + accuracyRatio * ACCURACY_WEIGHT) * 100,
    )
  } else {
    // No expected-pitch data: score purely on singing presence
    score = Math.round(presenceRatio * 100)
  }

  return { score, presenceRatio, accuracyRatio, totalFrames }
}
