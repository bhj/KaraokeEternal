/**
 * Timing Analyzer Module – compare user singing timestamps to expected note
 * timestamps from song metadata.
 *
 * A note is considered "on time" if the singer's detected onset falls within
 * ±ALLOWED_DEVIATION_MS of the expected onset.  The final `timingAccuracy`
 * value is the fraction of on-time onsets expressed as a number in [0, 1].
 *
 * All exported functions are pure (no side-effects, no global state).
 *
 * API
 * ---
 *   evaluateSample(userTimestamp, expectedTimestamp)
 *     → { isOnTime: boolean, deviation: number }
 *
 *   analyzeTimings(pairs)
 *     → timingAccuracy (number 0–1)
 *
 * Types
 * -----
 *   TimingPair  – { userTimestamp: number, expectedTimestamp: number }
 *     Timestamps are milliseconds since the Unix epoch (Date.now()).
 *
 * Usage
 * -----
 *   import { evaluateSample, analyzeTimings } from './timingAnalyzer.js'
 *
 *   // Evaluate a single note onset:
 *   const { isOnTime, deviation } = evaluateSample(userMs, expectedMs)
 *
 *   // Compute overall timing accuracy from a session's data:
 *   const accuracy = analyzeTimings(pairs) // 0.0 … 1.0
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Maximum allowed difference between a user onset and the expected onset to
 * be considered "on time", in milliseconds.
 *
 * The ±300 ms window matches typical karaoke game tolerances.
 */
export const ALLOWED_DEVIATION_MS = 300

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a single voice onset is on time.
 *
 * @param {number} userTimestamp     - Timestamp when the user's note was detected (ms).
 * @param {number} expectedTimestamp - Timestamp when the note was expected (ms).
 * @returns {{ isOnTime: boolean, deviation: number }}
 *   `isOnTime`  – true when `|deviation| <= ALLOWED_DEVIATION_MS`.
 *   `deviation` – signed difference in milliseconds (positive = late, negative = early).
 *
 * @example
 *   evaluateSample(1000, 950)
 *   // → { isOnTime: true, deviation: 50 }
 *
 *   evaluateSample(2000, 1500)
 *   // → { isOnTime: false, deviation: 500 }
 */
export function evaluateSample (userTimestamp, expectedTimestamp) {
  const deviation = userTimestamp - expectedTimestamp
  const isOnTime  = Math.abs(deviation) <= ALLOWED_DEVIATION_MS
  return { isOnTime, deviation }
}

/**
 * Calculate the overall timing accuracy for a session from an array of
 * (user timestamp, expected timestamp) pairs.
 *
 * @param {Array<{ userTimestamp: number, expectedTimestamp: number }>} pairs
 *   Each element represents one detected voice onset paired with the closest
 *   expected note onset from the song metadata.
 *
 * @returns {number} Fraction of on-time onsets in [0, 1].
 *   Returns 0 when `pairs` is empty.
 *
 * @example
 *   analyzeTimings([
 *     { userTimestamp: 1000, expectedTimestamp: 950 },   // on time
 *     { userTimestamp: 2000, expectedTimestamp: 1600 },  // late (400 ms)
 *     { userTimestamp: 3000, expectedTimestamp: 2750 },  // on time
 *   ])
 *   // → 0.667  (2 out of 3 on time)
 */
export function analyzeTimings (pairs) {
  if (!pairs || pairs.length === 0) return 0

  const onTimeCount = pairs.reduce((count, { userTimestamp, expectedTimestamp }) => {
    return count + (Math.abs(userTimestamp - expectedTimestamp) <= ALLOWED_DEVIATION_MS ? 1 : 0)
  }, 0)

  return onTimeCount / pairs.length
}

/**
 * Given a song-metadata array and a user event timestamp, find the metadata
 * entry whose `time` (seconds from song start) is closest to `elapsedSeconds`.
 *
 * @param {Array<{ time: number, note: number }>} metadata
 *   Sorted or unsorted array of expected note events.
 * @param {number} elapsedSeconds
 *   How many seconds into the song the user event occurred.
 * @param {number} [windowSeconds=0.5]
 *   Maximum distance in seconds before the result is considered too far away.
 * @returns {{ time: number, note: number } | null}
 *   Nearest metadata entry within the window, or `null` if nothing is close.
 */
export function findNearestMetadata (metadata, elapsedSeconds, windowSeconds = 0.5) {
  if (!metadata || metadata.length === 0) return null

  let nearest  = null
  let minDelta = Infinity

  for (const entry of metadata) {
    const delta = Math.abs(entry.time - elapsedSeconds)
    if (delta < minDelta) {
      minDelta = delta
      nearest  = entry
    }
  }

  return nearest && minDelta <= windowSeconds ? nearest : null
}
