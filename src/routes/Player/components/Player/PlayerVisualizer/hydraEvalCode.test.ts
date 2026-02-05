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
})
