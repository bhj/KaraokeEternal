/**
 * Render-thread entry point: the published SoundTouch worklet processor with
 * this project's pipeline configuration (see ./pipe). Webpack builds this as
 * its own self-contained bundle (see the pitchShifterProcessor entry in
 * config/webpack.config.js) — the AudioWorklet global scope has no way to load
 * further chunks, so nothing here may pull in anything webpack would split out.
 */

import { SoundTouchProcessorBase, STANDARD_PARAMETER_DESCRIPTORS } from '@soundtouchjs/worklet-base'
import { PROCESSOR_NAME } from './constants'
import { pipeOptions, prefill } from './pipe'

class PitchShifterProcessor extends SoundTouchProcessorBase {
  static get parameterDescriptors () {
    return STANDARD_PARAMETER_DESCRIPTORS
  }

  private hasStarted = false

  constructor () {
    super('[PitchShifterProcessor]', pipeOptions(sampleRate))

    prefill(this._pipe)
  }

  // Called only for blocks that fed the pipeline, so the first call marks
  // where LATENCY_FRAMES counts from; the node needs that time because it can
  // trail the main thread's currentTime by a callback or more. (The metrics
  // the base class passes go unused: latency is a constant.)
  protected onProcessComplete (): void {
    if (this.hasStarted) return

    this.hasStarted = true
    this.port.postMessage(currentTime)
  }
}

registerProcessor(PROCESSOR_NAME, PitchShifterProcessor)
