/**
 * Swap point for the loudness measurement backend.
 *
 * The intended backend is @audio/loudness-replaygain, but the features this
 * needs (track peak, BS.1770-4 Table 1 channel weights, a fused measurement
 * loop) only exist in our fork and haven't been accepted upstream. Depending on
 * the fork means a `file:` path to a sibling checkout, which doesn't resolve
 * for CI, Docker, or anyone else, so until those changes are published we ship
 * the in-tree implementation in './bespoke' instead.
 *
 * To switch back once the package has them: restore the adapter that used to
 * live in audiojs.ts, which maps the package's gain/peak/lufs onto the
 * interface below (`git show 22c92ab4:src/lib/replayGain/audiojs.ts`), point
 * the export at it, then delete bespoke.ts and loudness.ts with their tests.
 * measure.test.ts is backend-agnostic and should pass unchanged; its LFE case
 * is the check that the published build implements the channel weights rather
 * than weighting every channel 1.0.
 */

export interface ReplayGainMeasurement {
  /** dB adjustment to reach the ReplayGain 2.0 -18 LUFS reference */
  rgTrackGain: number
  /** linear sample peak across all channels */
  rgTrackPeak: number
  /** measured integrated loudness, for diagnostics */
  lufs: number
}

/** Returns null when nothing is measurable: silence, or a clip under one 400ms block. */
export type MeasureReplayGain = (
  channels: Float32Array[],
  sampleRate: number,
) => ReplayGainMeasurement | null

export { measureReplayGain } from './bespoke'
