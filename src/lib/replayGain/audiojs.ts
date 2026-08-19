import replaygain from '@audio/loudness-replaygain'
import type { MeasureReplayGain } from './measure'

/**
 * @audio/loudness-replaygain backend.
 *
 * The package's default channel weights assume SMPTE/Web Audio channel order,
 * which is what analyze.ts feeds it (decodeAudioData output), so no explicit
 * weights are passed. Its null (silence / fully-gated input) is extended here
 * to cover a non-positive peak, since the player divides by peak for its
 * clip-safe clamp.
 */
export const measureReplayGain: MeasureReplayGain = (channels, sampleRate) => {
  const result = replaygain(channels, { fs: sampleRate })
  if (result === null || result.peak <= 0) return null

  return {
    rgTrackGain: result.gain,
    rgTrackPeak: result.peak,
    lufs: result.lufs,
  }
}
