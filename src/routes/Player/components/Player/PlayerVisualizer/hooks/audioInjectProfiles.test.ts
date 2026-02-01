import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PROFILE,
  djb2Hash,
  normalizeForHash,
  getProfileForSketch,
  type AudioInjectProfile,
} from './audioInjectProfiles'

describe('DEFAULT_PROFILE', () => {
  it('has expected multipliers', () => {
    expect(DEFAULT_PROFILE).toEqual({
      modulate: 0.25,
      rotate: 0.08,
      scale: 0.08,
      colorShift: 0.06,
    })
  })
})

describe('djb2Hash', () => {
  it('returns consistent 8-char hex for same input', () => {
    const hash1 = djb2Hash('hello world')
    const hash2 = djb2Hash('hello world')
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(8)
    expect(hash1).toMatch(/^[0-9a-f]{8}$/)
  })

  it('returns different hashes for different inputs', () => {
    expect(djb2Hash('hello')).not.toBe(djb2Hash('world'))
  })

  it('handles empty string', () => {
    const hash = djb2Hash('')
    expect(hash).toHaveLength(8)
    expect(hash).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('normalizeForHash', () => {
  it('strips injected lines before hashing', () => {
    const codeWithInjection = [
      'osc(10)',
      '  .modulate(osc(3, 0.05), () => a.fft[0] * 0.25)',
      '  .rotate(() => a.fft[1] * 0.08)',
      '  .scale(() => 0.95 + a.fft[2] * 0.08)',
      '  .color(1, 1 - a.fft[3] * 0.06, 1 + a.fft[3] * 0.06)',
      '  .out()',
    ].join('\n')
    const codeWithout = 'osc(10)\n  .out()'
    expect(normalizeForHash(codeWithInjection)).toBe(normalizeForHash(codeWithout))
  })

  it('normalizes CRLF to LF', () => {
    expect(normalizeForHash('a\r\nb')).toBe(normalizeForHash('a\nb'))
  })

  it('trims trailing whitespace', () => {
    expect(normalizeForHash('abc   ')).toBe(normalizeForHash('abc'))
  })
})

describe('getProfileForSketch', () => {
  it('returns DEFAULT_PROFILE for unknown sketch id', () => {
    expect(getProfileForSketch('unknown_id', 'any code')).toEqual(DEFAULT_PROFILE)
  })

  it('returns DEFAULT_PROFILE when hash mismatches (code changed)', () => {
    // Even if the sketch_id matches a known profile, changed code → default
    const profile = getProfileForSketch('example_0', 'completely different code')
    expect(profile).toEqual(DEFAULT_PROFILE)
  })
})

describe('audioizeHydraCode with profiles', () => {
  it('uses custom multipliers when profile is provided', async () => {
    const { audioizeHydraCode } = await import('./audioizeHydraCode')
    const code = 'osc(10)\n  .out()'
    const customProfile: AudioInjectProfile = {
      modulate: 0.5,
      rotate: 0.2,
      scale: 0.15,
      colorShift: 0.1,
    }
    const result = audioizeHydraCode(code, customProfile)
    expect(result).toContain('a.fft[0] * 0.5')
    expect(result).toContain('a.fft[1] * 0.2')
    expect(result).toContain('a.fft[2] * 0.15')
    expect(result).toContain('a.fft[3] * 0.1')
  })

  it('idempotence holds with same profile', async () => {
    const { audioizeHydraCode } = await import('./audioizeHydraCode')
    const code = 'osc(10)\n  .out()'
    const once = audioizeHydraCode(code)
    const twice = audioizeHydraCode(once)
    expect(twice).toBe(once)
  })

  it('profile switch: strips old injection, applies new', async () => {
    const { audioizeHydraCode } = await import('./audioizeHydraCode')
    const code = 'osc(10)\n  .out()'
    const first = audioizeHydraCode(code)
    expect(first).toContain('a.fft[0] * 0.25') // default

    const customProfile: AudioInjectProfile = {
      modulate: 0.5,
      rotate: 0.2,
      scale: 0.15,
      colorShift: 0.1,
    }
    const second = audioizeHydraCode(first, customProfile)
    // Should NOT contain old multipliers
    expect(second).not.toContain('a.fft[0] * 0.25')
    expect(second).toContain('a.fft[0] * 0.5')
  })
})
