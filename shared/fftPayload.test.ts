import { describe, it, expect } from 'vitest'
import { isValidFftPayload } from './fftPayload'

describe('isValidFftPayload', () => {
  it('accepts a valid payload', () => {
    expect(isValidFftPayload({
      fft: [0.5],
      bass: 0.6,
      mid: 0.4,
      treble: 0.2,
      beat: 0,
      energy: 0.5,
      bpm: 0.5,
      bright: 0.4,
    })).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidFftPayload(null)).toBe(false)
  })

  it('rejects missing fft array', () => {
    expect(isValidFftPayload({ bass: 0.5 })).toBe(false)
  })

  it('rejects non-object', () => {
    expect(isValidFftPayload('string')).toBe(false)
    expect(isValidFftPayload(42)).toBe(false)
  })
})
