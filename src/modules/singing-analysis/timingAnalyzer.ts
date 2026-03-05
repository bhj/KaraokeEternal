/**
 * Timing Analyser – note-onset timing evaluation.
 *
 * Compares when the singer produced a note against when the song expected it,
 * reporting accuracy as a fraction in [0, 1].
 *
 * All functions are pure (no side-effects, no global state) so they are
 * straightforward to unit-test.
 *
 * API
 * ---
 *   evaluateSample(userTimestamp, expectedTimestamp)
 *     → { isOnTime: boolean, deviation: number }
 *
 *   analyzeTimings(pairs)
 *     → number  (fraction of on-time onsets, 0–1)
 *
 *   findNearestMetadata(metadata, elapsedSeconds, windowSeconds?)
 *     → SongNote | null
 *
 * Usage
 * -----
 *   import { evaluateSample, analyzeTimings, findNearestMetadata } from './timingAnalyzer'
 *
 *   const { isOnTime, deviation } = evaluateSample(userMs, expectedMs)
 *   const accuracy = analyzeTimings(pairs)   // 0.0 … 1.0
 */

import type { SongNote, TimingPair } from './types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Maximum allowed difference between a user onset and the expected onset to
 * be considered "on time", in milliseconds.
 *
 * The ±300 ms window matches typical karaoke-game tolerances.
 */
export const ALLOWED_DEVIATION_MS = 300

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a single voice onset is on time.
 *
 * @param userTimestamp     - Timestamp when the user's note was detected (ms).
 * @param expectedTimestamp - Timestamp when the note was expected (ms).
 * @returns Object with `isOnTime` flag and signed `deviation` in milliseconds.
 *          Positive deviation means the singer was late; negative means early.
 *
 * @example
 *   evaluateSample(1000, 950)
 *   // → { isOnTime: true, deviation: 50 }
 *
 *   evaluateSample(2000, 1500)
 *   // → { isOnTime: false, deviation: 500 }
 */
export function evaluateSample (
  userTimestamp: number,
  expectedTimestamp: number,
): { isOnTime: boolean, deviation: number } {
  const deviation = userTimestamp - expectedTimestamp
  const isOnTime = Math.abs(deviation) <= ALLOWED_DEVIATION_MS
  return { isOnTime, deviation }
}

/**
 * Calculate the overall timing accuracy for a session from an array of
 * (user timestamp, expected timestamp) pairs.
 *
 * @param pairs - Each element represents one detected voice onset paired with
 *                the closest expected note onset from the song metadata.
 * @returns Fraction of on-time onsets in [0, 1].  Returns 0 when `pairs` is empty.
 *
 * @example
 *   analyzeTimings([
 *     { userTimestamp: 1000, expectedTimestamp: 950 },   // on time
 *     { userTimestamp: 2000, expectedTimestamp: 1600 },  // late (400 ms)
 *     { userTimestamp: 3000, expectedTimestamp: 2750 },  // on time
 *   ])
 *   // → 0.667  (2 out of 3 on time)
 */
export function analyzeTimings (pairs: TimingPair[]): number {
  if (!pairs || pairs.length === 0) return 0

  const onTimeCount = pairs.reduce((count, { userTimestamp, expectedTimestamp }) => {
    return count + (Math.abs(userTimestamp - expectedTimestamp) <= ALLOWED_DEVIATION_MS ? 1 : 0)
  }, 0)

  return onTimeCount / pairs.length
}

/**
 * Given a song-metadata array and a user-event elapsed time, find the metadata
 * entry whose `time` (seconds from song start) is closest to `elapsedSeconds`.
 *
 * @param metadata        - Expected note events (sorted or unsorted).
 * @param elapsedSeconds  - How many seconds into the song the user event occurred.
 * @param windowSeconds   - Maximum allowed distance in seconds; entries further
 *                          away are ignored (default 0.5 s).
 * @returns Nearest {@link SongNote} within the window, or `null` if none found.
 *
 * @example
 *   const note = findNearestMetadata(
 *     [{ time: 1.0, note: 440 }, { time: 2.0, note: 493.88 }],
 *     1.1,
 *   )
 *   // → { time: 1.0, note: 440 }
 */
export function findNearestMetadata (
  metadata: SongNote[],
  elapsedSeconds: number,
  windowSeconds = 0.5,
): SongNote | null {
  if (!metadata || metadata.length === 0) return null

  let nearest: SongNote | null = null
  let minDelta = Infinity

  for (const entry of metadata) {
    const delta = Math.abs(entry.time - elapsedSeconds)
    if (delta < minDelta) {
      minDelta = delta
      nearest = entry
    }
  }

  return nearest && minDelta <= windowSeconds ? nearest : null
}
