/**
 * Swap point for the loudness measurement backend: measure.test.ts conforms
 * whichever backend is exported here to this interface, so a replacement only
 * has to satisfy those tests, not the rest of the player.
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

export { measureReplayGain } from './audiojs'
