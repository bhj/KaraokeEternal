import { ANALYSIS_HOP } from './constants'

/**
 * Nearest pitch ratio that moves the analysis window by a whole number of
 * frames per hop.
 *
 * SoundTouch drives the stretch stage at `tempo = 1/pitch` and the resampler at
 * `rate = pitch`, and the stretch stage necessarily rounds its hop to whole
 * frames. Feed it an arbitrary ratio and the two disagree about duration by up
 * to 0.11%: the output buffer drifts against the input all song, ending in
 * either latency creep or zero-filled gaps. Snapping the ratio so that rounding
 * is a no-op makes them exact inverses.
 *
 * Costs 1/(2 * ANALYSIS_HOP) of pitch accuracy — about 0.02 semitones, two
 * orders of magnitude below what anyone can hear. Absorbing the remainder in
 * the stretch stage instead was measurably worse: varying the hop between
 * frames decoheres the phase recursion and costs over a dB of broadband level.
 */
export function quantizePitch (semitones: number): number {
  return Math.round(ANALYSIS_HOP * Math.pow(2, semitones / 12)) / ANALYSIS_HOP
}
