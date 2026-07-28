import { lufsToTrackGain, measureLoudness } from './loudness'
import type { MeasureReplayGain } from './measure'

/**
 * In-tree BS.1770-4 implementation.
 *
 * TEMPORARY: stands in for @audio/loudness-replaygain until our changes to it
 * are published — see measure.ts for what to do then. Delete this file and
 * loudness.ts at that point; nothing else imports them.
 *
 * Faster than the package (one fused pass captures peak, both K-weighting
 * sections and the block power), but its channel-weight fallback only covers
 * mono/stereo/quad/5.1 — see loudness.ts.
 */
export const measureReplayGain: MeasureReplayGain = (channels, sampleRate) => {
  const { lufs, samplePeak } = measureLoudness(channels, sampleRate)
  if (lufs === null || samplePeak <= 0) return null

  return {
    rgTrackGain: lufsToTrackGain(lufs),
    rgTrackPeak: samplePeak,
    lufs,
  }
}
