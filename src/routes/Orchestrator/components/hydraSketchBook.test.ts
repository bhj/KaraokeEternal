import { describe, it, expect } from 'vitest'
import { DEFAULT_SKETCH, getRandomSketch } from './hydraSketchBook'
import { getPresetCount } from './hydraPresets'
import { HYDRA_GALLERY } from './hydraGallery'

describe('hydraSketchBook', () => {
  describe('DEFAULT_SKETCH', () => {
    it('is a non-empty string', () => {
      expect(DEFAULT_SKETCH.length).toBeGreaterThan(0)
    })

    it('is the marianne_1 gallery sketch (contains render(o0))', () => {
      expect(DEFAULT_SKETCH).toContain('render(o0)')
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

    it(`draws from the full gallery (${HYDRA_GALLERY.length} presets)`, () => {
      expect(getPresetCount()).toBe(HYDRA_GALLERY.length)
    })
  })
})
