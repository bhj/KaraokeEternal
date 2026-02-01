import { describe, it, expect } from 'vitest'
import { isValidFftPayload, type FftPayload } from './fftPayload'

describe('isValidFftPayload', () => {
  it('validates a correct payload', () => {
    const valid: FftPayload = {
      fft: [0, 1, 0.5],
      bass: 0.8,
      mid: 0.5,
      treble: 0.2,
      beat: 1,
      energy: 0.7,
      bpm: 120,
      bright: 0.3,
    }
    expect(isValidFftPayload(valid)).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidFftPayload(null)).toBe(false)
  })

  it('rejects missing fields', () => {
    const invalid = {
      fft: [],
      bass: 0.5,
      // missing others
    }
    expect(isValidFftPayload(invalid)).toBe(false)
  })

  it('rejects wrong types', () => {
    const invalid = {
      fft: 'not an array',
      bass: 0.5,
      mid: 0.5,
      treble: 0.2,
      beat: 1,
      energy: 0.7,
      bpm: 120,
      bright: 0.3,
    }
    expect(isValidFftPayload(invalid)).toBe(false)
  })
})