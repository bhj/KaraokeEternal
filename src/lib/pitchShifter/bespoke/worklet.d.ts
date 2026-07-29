/**
 * The AudioWorklet render-thread globals, which lib.dom doesn't declare (they
 * exist in AudioWorkletGlobalScope, not Window) and @soundtouchjs/worklet-base
 * doesn't ship with its types. Only what processor.ts and the base class need.
 */

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort
  constructor ()
  abstract process (
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean
}

declare function registerProcessor (
  name: string,
  processorCtor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor,
): void

/** The context's sample rate, injected into the worklet scope. */
declare const sampleRate: number
