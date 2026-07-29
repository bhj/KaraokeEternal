/**
 * How the SoundTouch pipeline is configured and primed. Shared so the tests
 * measure the same pipeline the worklet runs — the latency and underrun
 * behaviour both depend on these settings.
 */

import type { SoundTouch, SoundTouchOptions } from '@soundtouchjs/core'
import { createPhaseVocoderFactory } from '@soundtouchjs/stretch-phase-vocoder'
import { FFT_SIZE, OVERLAP_FACTOR, PREFILL_FRAMES } from './constants'

export function pipeOptions (sampleRate: number): SoundTouchOptions {
  return {
    sampleRate,
    // 'fifo' over the default 'circular': the render thread only appends a
    // block and drains a block, so the ring buffer's bookkeeping buys nothing.
    sampleBufferType: 'fifo',
    // Stated explicitly because SoundTouchOptions documents the default as
    // 'linear', which is wrong — only 'lanczos' is registered, and asking for
    // 'linear' throws at runtime.
    interpolationStrategy: 'lanczos',
    stretchFactory: createPhaseVocoderFactory(FFT_SIZE, OVERLAP_FACTOR),
  }
}

/**
 * Seeds the output buffer with silence.
 *
 * The processor drains a block per render quantum, but the vocoder only
 * produces on hop boundaries, so the buffer sawtooths down to exactly one block
 * — no margin. Wherever the resampler's fractional carry costs a frame the
 * block comes up short and gets zero-filled, which is a click; at some pitches
 * that lands on ~2% of blocks. A hop of silence up front lifts the trough clear
 * of it, and costs exactly its own length in latency.
 */
export function prefill (pipe: SoundTouch): void {
  pipe.outputBuffer.putSamples(new Float32Array(PREFILL_FRAMES * 2), 0, PREFILL_FRAMES)
}
