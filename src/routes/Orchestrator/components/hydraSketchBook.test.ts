import { describe, it, expect, vi } from 'vitest'
import { DEFAULT_SKETCH, getRandomSketch } from './hydraSketchBook'
import * as hydraPresets from './hydraPresets'
import { getDefaultPreset, getPresetByIndex, getPresetCount } from './hydraPresets'
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

    it('matches the raw default preset (no auto audio injection)', () => {
      expect(DEFAULT_SKETCH).toBe(getDefaultPreset())
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

    it('returns the raw gallery preset (no auto audio injection)', () => {
      const spy = vi.spyOn(hydraPresets, 'getRandomPreset').mockReturnValue(0)
      const result = getRandomSketch()
      expect(result).toBe(getPresetByIndex(0))
      spy.mockRestore()
    })

    it(`draws from the full gallery (${HYDRA_GALLERY.length} presets)`, () => {
      expect(getPresetCount()).toBe(HYDRA_GALLERY.length)
    })
  })
})
