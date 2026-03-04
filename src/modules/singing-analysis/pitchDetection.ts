/**
 * Pitch Detection – autocorrelation-based fundamental-frequency estimator.
 *
 * The algorithm computes the normalised autocorrelation of an audio frame and
 * locates the first significant peak, then refines the lag estimate with
 * parabolic interpolation to achieve sub-sample accuracy.
 *
 * Pure functions only – no side-effects, no global state – making this easy
 * to unit-test in isolation.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Standard concert pitch: A4 = 440 Hz. */
export const A4_FREQUENCY = 440

/** MIDI note number for A4. */
export const A4_MIDI = 69

/** Note names in chromatic order, starting at C. */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/**
 * Minimum RMS amplitude required to attempt pitch detection.
 * Below this threshold the signal is treated as silence.
 */
const MIN_RMS_AMPLITUDE = 0.01

// ---------------------------------------------------------------------------
// Music-theory helpers
// ---------------------------------------------------------------------------

/**
 * Convert a frequency (Hz) to the nearest MIDI note number.
 *
 * @example frequencyToMidi(440) === 69  // A4
 */
export function frequencyToMidi (frequency: number): number {
  return Math.round(12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI)
}

/**
 * Convert a MIDI note number to the corresponding frequency (Hz).
 *
 * @example midiToFrequency(69) === 440  // A4
 */
export function midiToFrequency (midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12)
}

/**
 * Convert a frequency (Hz) to a human-readable note name including octave
 * number (scientific pitch notation).
 *
 * @example frequencyToNoteName(440) === 'A4'
 * @example frequencyToNoteName(261.63) === 'C4'  // middle C
 */
export function frequencyToNoteName (frequency: number): string {
  const midi = frequencyToMidi(frequency)
  const octave = Math.floor(midi / 12) - 1
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  return `${name}${octave}`
}

/**
 * Calculate the deviation of a frequency from its nearest equal-tempered
 * note in cents.
 *
 * Returns 0 when exactly on pitch, positive when sharp, negative when flat.
 * The value is in the range [-50, +50].
 *
 * @example getCentsDeviation(440) === 0   // A4, perfectly in tune
 * @example getCentsDeviation(450) ≈ +39   // slightly sharp
 */
export function getCentsDeviation (frequency: number): number {
  const midi = frequencyToMidi(frequency)
  const perfectFreq = midiToFrequency(midi)
  return Math.round(1200 * Math.log2(frequency / perfectFreq))
}

// ---------------------------------------------------------------------------
// Pitch detection
// ---------------------------------------------------------------------------

/**
 * Detect the fundamental frequency of an audio frame using autocorrelation
 * with parabolic interpolation.
 *
 * @param buffer      - PCM time-domain samples (Float32Array from AnalyserNode)
 * @param sampleRate  - Sample rate of the audio context (Hz)
 * @param minHz       - Lower frequency bound for detection (default 80 Hz ≈ E2)
 * @param maxHz       - Upper frequency bound for detection (default 1400 Hz ≈ F6)
 * @returns Estimated fundamental frequency in Hz, or `null` when the signal is
 *          too quiet or no clear periodicity can be found.
 */
export function detectPitch (
  buffer: Float32Array,
  sampleRate: number,
  minHz = 80,
  maxHz = 1400,
): number | null {
  const size = buffer.length

  // ── 1. Silence gate ──────────────────────────────────────────────────────
  let sumSq = 0
  for (let i = 0; i < size; i++) sumSq += buffer[i] * buffer[i]
  const rms = Math.sqrt(sumSq / size)
  if (rms < MIN_RMS_AMPLITUDE) return null

  // ── 2. Lag bounds derived from requested frequency range ─────────────────
  const minLag = Math.floor(sampleRate / maxHz)
  const maxLag = Math.min(Math.floor(sampleRate / minHz), size - 1)
  if (minLag >= maxLag) return null

  // ── 3. Unnormalised autocorrelation ──────────────────────────────────────
  //
  //   r[lag] = Σ buffer[j] * buffer[j + lag]
  //
  // We skip lag-0 (always the maximum) and search only the valid band.
  const corr = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0
    const limit = size - lag
    for (let j = 0; j < limit; j++) s += buffer[j] * buffer[j + lag]
    corr[lag] = s
  }

  // ── 4. Find the highest correlation peak ─────────────────────────────────
  let bestLag = minLag
  let bestCorr = corr[minLag]
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (corr[lag] > bestCorr) {
      bestCorr = corr[lag]
      bestLag = lag
    }
  }

  // Reject if peak correlation is not positive (pure noise frame)
  if (bestCorr <= 0) return null

  // ── 5. Parabolic interpolation for sub-sample lag precision ──────────────
  const prev = bestLag > minLag ? corr[bestLag - 1] : bestCorr
  const next = bestLag < maxLag ? corr[bestLag + 1] : bestCorr
  const denom = 2 * bestCorr - prev - next
  const refinedLag = denom !== 0
    ? bestLag + (next - prev) / (2 * denom)
    : bestLag

  return sampleRate / refinedLag
}
