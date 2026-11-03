/**
 * Swap point for the pitch shifting backend.
 *
 * The DSP is entirely published SoundTouchJS: core, worklet-base, the FFT
 * primitives, the lanczos resampler and the phase vocoder stretch stage
 * (whose stereo-coherence and level fixes landed upstream in 2.1.1) are all
 * installed from npm. ./bespoke is only the integration: a worklet processor
 * that hands the published stretch stage to SoundTouch via `stretchFactory`
 * (a documented seam), and the node that drives it.
 *
 * The package's own PhaseVocoderNode is still not used, because it neither
 * quantizes pitch nor prefills the output buffer — see ./bespoke/pitch and
 * ./bespoke/pipe for what each prevents — and LATENCY_FRAMES is measured
 * against this arrangement. Adopting it would mean re-verifying audioLatency
 * against CDG sync.
 */
import { PitchShifterNode } from './bespoke/node'
import type { PitchShifter, PitchShifterEngine } from './index'

export const phaseVocoderEngine: PitchShifterEngine = {
  // AudioWorklet is only exposed in secure contexts
  isSupported: () => typeof window !== 'undefined' && 'AudioWorklet' in window,

  prepare: (ctx: AudioContext) => PitchShifterNode.register(ctx),

  create: (ctx: AudioContext): PitchShifter => {
    const node = new PitchShifterNode(ctx)

    return {
      node,
      latency: node.latency,
      fullLevelAt: node.fullLevelAt,
      setPitchSemitones: (semitones: number) => node.setPitchSemitones(semitones),
      dispose: () => node.disconnect(),
    }
  },
}
