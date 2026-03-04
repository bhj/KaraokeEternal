/**
 * Unit tests for the pitch-detection utility functions.
 *
 * Only pure functions are tested here.  The SingingAnalysis class and the
 * React component are integration concerns that would require a browser
 * environment (Web Audio API).
 */

import { describe, it, expect } from 'vitest'
import {
  A4_FREQUENCY,
  A4_MIDI,
  NOTE_NAMES,
  frequencyToMidi,
  midiToFrequency,
  frequencyToNoteName,
  getCentsDeviation,
  detectPitch,
} from './pitchDetection'

// ---------------------------------------------------------------------------
// Music-theory helpers
// ---------------------------------------------------------------------------

describe('frequencyToMidi', () => {
  it('returns 69 for A4 (440 Hz)', () => {
    expect(frequencyToMidi(440)).toBe(A4_MIDI)
  })

  it('returns 60 for middle C (≈261.63 Hz)', () => {
    expect(frequencyToMidi(261.63)).toBe(60)
  })

  it('returns 57 for A3 (220 Hz)', () => {
    expect(frequencyToMidi(220)).toBe(57)
  })

  it('returns 81 for A5 (880 Hz)', () => {
    expect(frequencyToMidi(880)).toBe(81)
  })
})

describe('midiToFrequency', () => {
  it('returns 440 for MIDI 69 (A4)', () => {
    expect(midiToFrequency(A4_MIDI)).toBeCloseTo(A4_FREQUENCY, 2)
  })

  it('is the inverse of frequencyToMidi for whole notes', () => {
    const midiNotes = [48, 60, 69, 72, 84]
    midiNotes.forEach((midi) => {
      const freq = midiToFrequency(midi)
      expect(frequencyToMidi(freq)).toBe(midi)
    })
  })
})

describe('frequencyToNoteName', () => {
  it('returns "A4" for 440 Hz', () => {
    expect(frequencyToNoteName(440)).toBe('A4')
  })

  it('returns "C4" for middle C (≈261.63 Hz)', () => {
    expect(frequencyToNoteName(261.63)).toBe('C4')
  })

  it('returns "A3" for 220 Hz', () => {
    expect(frequencyToNoteName(220)).toBe('A3')
  })

  it('returns "A5" for 880 Hz', () => {
    expect(frequencyToNoteName(880)).toBe('A5')
  })

  it('all note names are from the chromatic scale', () => {
    // Spot-check a full octave starting at C4
    const expected = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']
    expected.forEach((name, semitone) => {
      const midi = 60 + semitone
      const freq = midiToFrequency(midi)
      expect(frequencyToNoteName(freq)).toBe(name)
    })
  })

  it('handles negative octaves gracefully (very low notes)', () => {
    // MIDI 0 is C-1 in scientific pitch notation
    const name = frequencyToNoteName(midiToFrequency(0))
    expect(name).toBe('C-1')
  })
})

describe('getCentsDeviation', () => {
  it('returns 0 for exactly A4 (440 Hz)', () => {
    expect(getCentsDeviation(440)).toBe(0)
  })

  it('returns 0 for exactly C4', () => {
    expect(getCentsDeviation(midiToFrequency(60))).toBe(0)
  })

  it('returns a positive value when slightly sharp', () => {
    // ~450 Hz is slightly sharp of A4
    expect(getCentsDeviation(450)).toBeGreaterThan(0)
  })

  it('returns a negative value when slightly flat', () => {
    // ~430 Hz is slightly flat of A4
    expect(getCentsDeviation(430)).toBeLessThan(0)
  })

  it('stays within ±50 cents for any frequency', () => {
    const testFreqs = [100, 220, 261.63, 440, 880, 1000]
    testFreqs.forEach((f) => {
      const cents = getCentsDeviation(f)
      expect(Math.abs(cents)).toBeLessThanOrEqual(50)
    })
  })
})

// ---------------------------------------------------------------------------
// Pitch detection – synthetic signals
// ---------------------------------------------------------------------------

/**
 * Generate a synthetic sine wave of a given frequency.
 *
 * @param frequency  Target frequency (Hz)
 * @param sampleRate Audio context sample rate (Hz)
 * @param size       Number of samples
 */
function generateSineWave (
  frequency: number,
  sampleRate: number,
  size: number,
): Float32Array {
  const buffer = new Float32Array(size)
  for (let i = 0; i < size; i++) {
    buffer[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate))
  }
  return buffer
}

describe('detectPitch', () => {
  const SAMPLE_RATE = 44100
  const BUFFER_SIZE = 2048

  it('detects A4 (440 Hz) from a clean sine wave', () => {
    const buffer = generateSineWave(440, SAMPLE_RATE, BUFFER_SIZE)
    const detected = detectPitch(buffer, SAMPLE_RATE)
    expect(detected).not.toBeNull()
    // Allow ±5 Hz tolerance for the autocorrelation algorithm
    expect(detected!).toBeGreaterThan(435)
    expect(detected!).toBeLessThan(445)
  })

  it('detects A3 (220 Hz) from a clean sine wave', () => {
    const buffer = generateSineWave(220, SAMPLE_RATE, BUFFER_SIZE)
    const detected = detectPitch(buffer, SAMPLE_RATE)
    expect(detected).not.toBeNull()
    expect(detected!).toBeGreaterThan(215)
    expect(detected!).toBeLessThan(225)
  })

  it('returns null for a silent (all-zero) buffer', () => {
    const buffer = new Float32Array(BUFFER_SIZE)
    expect(detectPitch(buffer, SAMPLE_RATE)).toBeNull()
  })

  it('returns null for a very low-amplitude signal (below threshold)', () => {
    const buffer = generateSineWave(440, SAMPLE_RATE, BUFFER_SIZE)
      .map(v => v * 0.005) as Float32Array
    expect(detectPitch(new Float32Array(buffer), SAMPLE_RATE)).toBeNull()
  })

  it('does not detect a frequency below the minimum range', () => {
    // 40 Hz is below the default 80 Hz minimum; the algorithm should either
    // return null or detect a harmonic (not the sub-range fundamental itself).
    const buffer = generateSineWave(40, SAMPLE_RATE, BUFFER_SIZE)
    const detected = detectPitch(buffer, SAMPLE_RATE, 80, 1400)
    if (detected !== null) {
      // The fundamental at 40 Hz must not have been returned; any detected
      // harmonic is outside the sub-80 Hz band.
      expect(detected).toBeGreaterThan(60)
    }
  })
})

describe('NOTE_NAMES', () => {
  it('contains exactly 12 chromatic note names', () => {
    expect(NOTE_NAMES).toHaveLength(12)
  })
})
