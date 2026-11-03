/**
 * Shared by the main-thread node and the render-thread processor, which are
 * separate bundles. Deliberately free of imports so the main bundle doesn't
 * drag in the DSP just to read a name or a latency.
 */

/** Registered name of the processor in the AudioWorklet global scope. */
export const PROCESSOR_NAME = 'ke-pitch-shifter'

/**
 * Filename the processor bundle is emitted as. Must match the
 * `pitchShifterProcessor` entry's `filename` in config/webpack.config.js — an
 * AudioWorklet is fetched by URL, so the two can't be resolved for us.
 */
export const PROCESSOR_FILENAME = 'pitchShifterProcessor.js'

/**
 * FFT frame size. Frequency resolution against latency: 2048 puts the bin
 * width around 21 Hz at 44.1 kHz, low enough to resolve bass partials, and
 * lands total latency near 50 ms.
 */
export const FFT_SIZE = 2048

/** Overlap factor; 4 (75%) is the usual WOLA choice. */
export const OVERLAP_FACTOR = 4

/** Frames the analysis window advances per hop. */
export const ANALYSIS_HOP = FFT_SIZE / OVERLAP_FACTOR

/** Frames per render block, fixed by the Web Audio spec. */
export const RENDER_QUANTUM = 128

/**
 * Output cushion seeded before playback; see prefill() in ./pipe.
 *
 * One hop is what needs to survive into steady state. The three render blocks
 * on top cover the startup gap: the pipeline produces nothing until the first
 * hop completes, and those blocks drain the cushion before it settles.
 */
export const PREFILL_FRAMES = ANALYSIS_HOP + RENDER_QUANTUM * 3

/**
 * Input-to-output group delay in frames, for compensating anything synced to
 * the audio (CDG frame timing).
 *
 * Measured rather than derived: it falls out of how the analysis window, the
 * resampler and three sample buffers inside SoundTouch line up, which is not
 * worth reconstructing in a comment. pipeline.test.ts drives the pipeline the
 * way the worklet does and asserts the real delay against this, so it fails
 * loudly if a version bump or a setting moves it.
 *
 * Exact at no shift. Shifted, the real delay is shorter by up to ~300 frames
 * (±6 semitones), well under a video frame; the tests bound it.
 */
export const LATENCY_FRAMES = 2433

/**
 * Frames past LATENCY_FRAMES until the output reaches full level. The first
 * hops of a fresh pipeline come out a few dB low, and crossfading onto them
 * deepens the crossover dip by about 2 dB; from here on it is at the floor of
 * a plain crossfade. Measured, and asserted in pipeline.test.ts.
 */
export const SETTLE_FRAMES = FFT_SIZE / 2
