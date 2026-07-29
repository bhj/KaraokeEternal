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

  constructor () {
    super('[PitchShifterProcessor]', pipeOptions(sampleRate))

    prefill(this._pipe)
  }

  // metrics are the base class's reason to message the main thread; we read
  // latency from a constant instead, so there is nothing to report
  protected onProcessComplete (): void {}
}

registerProcessor(PROCESSOR_NAME, PitchShifterProcessor)
