import { describe, it, expect } from 'vitest'
import { DEFAULT_SKETCH, getRandomSketch } from './hydraSketchBook'
import { getPresetCount } from './hydraPresets'

describe('hydraSketchBook', () => {
  describe('DEFAULT_SKETCH', () => {
    it('is a non-empty string', () => {
      expect(DEFAULT_SKETCH.length).toBeGreaterThan(0)
    })

    it('is the mahalia_0 gallery sketch (contains render(o2))', () => {
      expect(DEFAULT_SKETCH).toContain('render(o2)')
    })

    it('contains .out( (valid Hydra output)', () => {
      expect(DEFAULT_SKETCH).toContain('.out(')
    })
  })

  describe('getRandomSketch', () => {
    it('returns a non-empty sketch from the gallery', () => {
      const result = getRandomSketch()
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns a valid Hydra sketch (contains .out( or render()', () => {
      const result = getRandomSketch()
      const hasOutput = result.includes('.out(') || result.includes('render(')
      expect(hasOutput).toBe(true)
    })

    it('draws from the full gallery (58 presets)', () => {
      expect(getPresetCount()).toBe(58)
    })
  })
})
