/**
 * Pitch Detector Module – frequency estimation from raw PCM audio.
 *
 * Implements an autocorrelation-based fundamental-frequency estimator with
 * parabolic interpolation for sub-sample accuracy.  All functions are pure
 * (no side-effects, no global state) so they are straightforward to unit-test.
 *
 * API
 * ---
 *   detectPitch(audioBuffer, sampleRate) → { pitch: 440, note: "A4" } | null
 *
 * Usage
 * -----
 *   import { detectPitch } from './pitchDetector.js'
 *
 *   const analyser = getAnalyserNode()
 *   const buf = new Float32Array(analyser.fftSize / 2)
 *   analyser.getFloatTimeDomainData(buf)
 *
 *   const result = detectPitch(buf, audioCtx.sampleRate)
 *   if (result) console.log(result.note, result.pitch)
 */

// ---------------------------------------------------------------------------
// Music-theory constants
// ---------------------------------------------------------------------------

/** Standard concert pitch: A4 = 440 Hz. */
const A4_FREQUENCY = 440

/** MIDI note number for A4. */
const A4_MIDI = 69

/** Chromatic note names in ascending order, starting from C. */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// ---------------------------------------------------------------------------
// Pitch-detection configuration
// ---------------------------------------------------------------------------

/**
 * Minimum RMS amplitude required to attempt pitch detection.
 * Frames below this threshold are treated as silence and return `null`.
 */
const MIN_RMS_AMPLITUDE = 0.01

/** Lower bound for detected frequencies (≈ E2). */
const MIN_FREQUENCY_HZ = 80

/** Upper bound for detected frequencies (≈ F6). */
const MAX_FREQUENCY_HZ = 1400

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a frequency in Hz to the nearest MIDI note number.
 *
 * @param {number} frequency - Frequency in Hz.
 * @returns {number} MIDI note number (integer).
 */
function frequencyToMidi (frequency) {
  return Math.round(12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI)
}

/**
 * Convert a MIDI note number to the corresponding frequency in Hz.
 *
 * @param {number} midi - MIDI note number.
 * @returns {number} Frequency in Hz.
 */
export function midiToFrequency (midi) {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12)
}

/**
 * Convert a frequency in Hz to a human-readable note name with octave number
 * (scientific pitch notation), e.g. `440 → "A4"`, `261.63 → "C4"`.
 *
 * @param {number} frequency - Frequency in Hz.
 * @returns {string} Note name such as "A4" or "C#5".
 */
export function frequencyToNoteName (frequency) {
  const midi = frequencyToMidi(frequency)
  const octave = Math.floor(midi / 12) - 1
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  return `${name}${octave}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect the fundamental frequency (pitch) of an audio frame.
 *
 * Uses normalised autocorrelation to find the dominant periodicity, then
 * refines the lag estimate with parabolic interpolation.
 *
 * @param {Float32Array} audioBuffer
 *   PCM time-domain samples obtained via `AnalyserNode.getFloatTimeDomainData()`.
 * @param {number} sampleRate
 *   Sample rate of the audio context in Hz (typically 44100 or 48000).
 * @param {number} [minHz=80]
 *   Lower frequency boundary for detection (default ≈ E2).
 * @param {number} [maxHz=1400]
 *   Upper frequency boundary for detection (default ≈ F6).
 *
 * @returns {{ pitch: number, note: string } | null}
 *   Object with `pitch` (frequency in Hz) and `note` (e.g. "A4"), or `null`
 *   when the frame is silent or no clear periodicity can be found.
 *
 * @example
 *   const result = detectPitch(buf, 44100)
 *   // → { pitch: 440.12, note: "A4" }
 */
export function detectPitch (audioBuffer, sampleRate, minHz = MIN_FREQUENCY_HZ, maxHz = MAX_FREQUENCY_HZ) {
  const size = audioBuffer.length

  // ── 1. Silence gate ──────────────────────────────────────────────────────
  let sumSq = 0
  for (let i = 0; i < size; i++) sumSq += audioBuffer[i] * audioBuffer[i]
  const rms = Math.sqrt(sumSq / size)
  if (rms < MIN_RMS_AMPLITUDE) return null

  // ── 2. Convert frequency bounds to autocorrelation lag bounds ────────────
  const minLag = Math.floor(sampleRate / maxHz)
  const maxLag = Math.min(Math.floor(sampleRate / minHz), size - 1)
  if (minLag >= maxLag) return null

  // ── 3. Unnormalised autocorrelation ──────────────────────────────────────
  //
  //   r[lag] = Σ buffer[j] * buffer[j + lag]
  //
  const corr = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0
    const limit = size - lag
    for (let j = 0; j < limit; j++) s += audioBuffer[j] * audioBuffer[j + lag]
    corr[lag] = s
  }

  // ── 4. Find the lag with the highest correlation ──────────────────────────
  let bestLag = minLag
  let bestCorr = corr[minLag]
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (corr[lag] > bestCorr) {
      bestCorr = corr[lag]
      bestLag = lag
    }
  }

  if (bestCorr <= 0) return null // pure noise – no periodic signal

  // ── 5. Parabolic interpolation for sub-sample precision ──────────────────
  const prev = bestLag > minLag ? corr[bestLag - 1] : bestCorr
  const next = bestLag < maxLag ? corr[bestLag + 1] : bestCorr
  const denom = 2 * bestCorr - prev - next
  const refinedLag = denom !== 0
    ? bestLag + (next - prev) / (2 * denom)
    : bestLag

  const pitch = sampleRate / refinedLag
  const note = frequencyToNoteName(pitch)

  return { pitch, note }
}
