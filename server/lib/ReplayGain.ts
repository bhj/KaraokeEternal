/**
 * ReplayGain values are calculated by the player client, which decodes the
 * media with the browser's own codecs (see src/lib/replayGain). The server
 * only persists what it's told, so the bounds here are a trust boundary:
 * without them a client could store a gain that makes every future playback
 * of a song deafening.
 */

// -18 LUFS reference against a [-70, 0] LUFS range gives [-18, +52]; the
// ReplayGain tag format itself clamps at +/-51 dB
export const RG_GAIN_MIN = -60
export const RG_GAIN_MAX = 60

// peaks above 1.0 are legitimate: lossy decoding overshoots
export const RG_PEAK_MAX = 4

export function isValidReplayGain (gain: unknown, peak: unknown): boolean {
  return typeof gain === 'number' && Number.isFinite(gain)
    && gain >= RG_GAIN_MIN && gain <= RG_GAIN_MAX
    && typeof peak === 'number' && Number.isFinite(peak)
    && peak > 0 && peak <= RG_PEAK_MAX
}
