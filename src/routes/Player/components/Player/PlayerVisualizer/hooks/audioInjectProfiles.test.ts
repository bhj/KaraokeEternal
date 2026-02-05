import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PROFILE,
  djb2Hash,
  normalizeForHash,
  getProfileForSketch,
  scaleProfile,
  INJECTION_FACTORS,
  type AudioInjectProfile,
} from './audioInjectProfiles'

describe('DEFAULT_PROFILE', () => {
  it('has expected multipliers', () => {
    expect(DEFAULT_PROFILE).toEqual({
      modulate: 0.25,
      rotate: 0.08,
      scale: 0.08,
      colorShift: 0.06,
      saturate: 0.3,
      contrast: 0.2,
      brightness: 0.15,
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

describe('scaleProfile', () => {
  it('scales all values by factor 0.5', () => {
    const result = scaleProfile(DEFAULT_PROFILE, 0.5)
    expect(result.modulate).toBeCloseTo(DEFAULT_PROFILE.modulate * 0.5)
    expect(result.rotate).toBeCloseTo(DEFAULT_PROFILE.rotate * 0.5)
    expect(result.scale).toBeCloseTo(DEFAULT_PROFILE.scale * 0.5)
    expect(result.colorShift).toBeCloseTo(DEFAULT_PROFILE.colorShift * 0.5)
    expect(result.saturate).toBeCloseTo(DEFAULT_PROFILE.saturate * 0.5)
    expect(result.contrast).toBeCloseTo(DEFAULT_PROFILE.contrast * 0.5)
    expect(result.brightness).toBeCloseTo(DEFAULT_PROFILE.brightness * 0.5)
  })

  it('scales all values by factor 2.0', () => {
    const result = scaleProfile(DEFAULT_PROFILE, 2.0)
    expect(result.modulate).toBeCloseTo(DEFAULT_PROFILE.modulate * 2.0)
    expect(result.rotate).toBeCloseTo(DEFAULT_PROFILE.rotate * 2.0)
    expect(result.scale).toBeCloseTo(DEFAULT_PROFILE.scale * 2.0)
    expect(result.colorShift).toBeCloseTo(DEFAULT_PROFILE.colorShift * 2.0)
    expect(result.saturate).toBeCloseTo(DEFAULT_PROFILE.saturate * 2.0)
    expect(result.contrast).toBeCloseTo(DEFAULT_PROFILE.contrast * 2.0)
    expect(result.brightness).toBeCloseTo(DEFAULT_PROFILE.brightness * 2.0)
  })

  it('scales all values to zero with factor 0', () => {
    const result = scaleProfile(DEFAULT_PROFILE, 0)
    expect(result.modulate).toBe(0)
    expect(result.rotate).toBe(0)
    expect(result.scale).toBe(0)
    expect(result.colorShift).toBe(0)
    expect(result.saturate).toBe(0)
    expect(result.contrast).toBe(0)
    expect(result.brightness).toBe(0)
  })

  it('does not mutate the input profile', () => {
    const original = { ...DEFAULT_PROFILE }
    scaleProfile(DEFAULT_PROFILE, 3.0)
    expect(DEFAULT_PROFILE).toEqual(original)
  })
})

describe('INJECTION_FACTORS', () => {
  it('has low, med, high levels', () => {
    expect(INJECTION_FACTORS).toHaveProperty('low')
    expect(INJECTION_FACTORS).toHaveProperty('med')
    expect(INJECTION_FACTORS).toHaveProperty('high')
  })

  it('med is 1.0 (unscaled default)', () => {
    expect(INJECTION_FACTORS.med).toBe(1.0)
  })

  it('low < med < high', () => {
    expect(INJECTION_FACTORS.low).toBeLessThan(INJECTION_FACTORS.med)
    expect(INJECTION_FACTORS.med).toBeLessThan(INJECTION_FACTORS.high)
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
      saturate: 0.6,
      contrast: 0.4,
      brightness: 0.3,
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
      saturate: 0.6,
      contrast: 0.4,
      brightness: 0.3,
    }
    const second = audioizeHydraCode(first, customProfile)
    // Should NOT contain old multipliers
    expect(second).not.toContain('a.fft[0] * 0.25')
    expect(second).toContain('a.fft[0] * 0.5')
  })
})
