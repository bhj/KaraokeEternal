/**
 * Main-thread handle for the pitch shifter worklet. Stands in for
 * PhaseVocoderNode from the package, which neither quantizes pitch nor
 * prefills the output buffer — see ./pitch and ./pipe.
 */

import { LATENCY_FRAMES, PROCESSOR_FILENAME, PROCESSOR_NAME } from './constants'
import { quantizePitch } from './pitch'

export class PitchShifterNode extends AudioWorkletNode {
  /**
   * Loads the processor bundle into `ctx`'s worklet scope. Must resolve before
   * constructing a node; calling it more than once per context is harmless.
   *
   * The URL is resolved against the document base rather than bundled via
   * `import.meta.url`, because the app can be served from a subpath.
   */
  static register (ctx: BaseAudioContext): Promise<void> {
    return ctx.audioWorklet.addModule(`${document.baseURI}${PROCESSOR_FILENAME}`)
  }

  /**
   * Input-to-output group delay in seconds, for compensating anything synced to
   * the audio. A constant so it can be read the moment the node exists.
   */
  readonly latency: number

  constructor (ctx: BaseAudioContext) {
    super(ctx, PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })

    this.latency = LATENCY_FRAMES / ctx.sampleRate
  }

  /**
   * Retunes by `semitones`. Drives the processor's `pitch` param with a ratio
   * rather than its `pitchSemitones` param, so the quantization above survives
   * instead of being re-derived through a log/exp round trip.
   */
  setPitchSemitones (semitones: number): void {
    this.parameters.get('pitch').value = quantizePitch(semitones)
  }
}
