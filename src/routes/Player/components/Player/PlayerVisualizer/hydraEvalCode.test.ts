import { describe, it, expect } from 'vitest'
import { getHydraEvalCode, DEFAULT_PATCH } from './hydraEvalCode'

describe('getHydraEvalCode', () => {
  it('returns raw code unchanged (no auto-audio injection)', () => {
    const code = 'osc(10).out()'
    expect(getHydraEvalCode(code)).toBe(code)
  })

  it('falls back to default patch when code is empty', () => {
    expect(getHydraEvalCode('')).toBe(DEFAULT_PATCH)
  })

  it('default patch uses native a.fft API only', () => {
    expect(DEFAULT_PATCH).toContain('a.fft[')
    expect(DEFAULT_PATCH).not.toContain('bass(')
    expect(DEFAULT_PATCH).not.toContain('mid(')
    expect(DEFAULT_PATCH).not.toContain('treble(')
    expect(DEFAULT_PATCH).not.toContain('beat(')
    expect(DEFAULT_PATCH).not.toContain('energy(')
    expect(DEFAULT_PATCH).not.toContain('bpm(')
    expect(DEFAULT_PATCH).not.toContain('bright(')
  })
})
