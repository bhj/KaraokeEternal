import { describe, it, expect } from 'vitest'
import {
  decodeSketch,
  getPresetCount,
  getPresetByIndex,
  getPresetLabel,
  getDefaultPreset,
  getDefaultPresetIndex,
  getNextPreset,
  getPrevPreset,
  getRandomPreset,
  PRESETS,
} from './hydraPresets'
import { HYDRA_GALLERY } from './hydraGallery'

describe('hydraPresets', () => {
  describe('decodeSketch', () => {
    it('decodes a gallery item from base64+URI encoding', () => {
      const item = HYDRA_GALLERY[0]
      const decoded = decodeSketch(item)
      expect(decoded.length).toBeGreaterThan(0)
      expect(decoded).toContain('.out(')
    })

    it('handles invalid base64 gracefully (returns empty string)', () => {
      const result = decodeSketch({ sketch_id: 'bad', code: '%%%invalid%%' })
      expect(result).toBe('')
    })
  })

  describe('gallery integrity', () => {
    it(`has exactly ${HYDRA_GALLERY.length} entries`, () => {
      expect(getPresetCount()).toBe(HYDRA_GALLERY.length)
    })

    it('all decoded sketches contain .out( or render(', () => {
      for (let i = 0; i < getPresetCount(); i++) {
        const code = getPresetByIndex(i)
        const hasOutput = code.includes('.out(') || code.includes('render(')
        expect(hasOutput, `Sketch ${i} (${HYDRA_GALLERY[i].sketch_id}) missing .out() or render()`).toBe(true)
      }
    })

    it('all PRESETS entries are non-empty strings', () => {
      for (let i = 0; i < PRESETS.length; i++) {
        expect(PRESETS[i].length, `PRESETS[${i}] is empty`).toBeGreaterThan(0)
      }
    })
  })

  describe('getPresetByIndex', () => {
    it('returns first gallery sketch decoded', () => {
      const first = getPresetByIndex(0)
      expect(first.length).toBeGreaterThan(0)
    })

    it('returns last gallery sketch decoded', () => {
      const last = getPresetByIndex(getPresetCount() - 1)
      expect(last.length).toBeGreaterThan(0)
    })
  })

  describe('getPresetLabel', () => {
    it(`returns [1/${HYDRA_GALLERY.length}] sketch_id format for index 0`, () => {
      const label = getPresetLabel(0)
      expect(label).toBe(`[1/${HYDRA_GALLERY.length}] ${HYDRA_GALLERY[0].sketch_id}`)
    })

    it(`returns [${HYDRA_GALLERY.length}/${HYDRA_GALLERY.length}] sketch_id format for last index`, () => {
      const lastIdx = getPresetCount() - 1
      const label = getPresetLabel(lastIdx)
      expect(label).toBe(`[${HYDRA_GALLERY.length}/${HYDRA_GALLERY.length}] ${HYDRA_GALLERY[lastIdx].sketch_id}`)
    })
  })

  describe('getDefaultPreset', () => {
    it('returns marianne_1 decoded', () => {
      const preset = getDefaultPreset()
      expect(preset).toContain('render(o0)')
    })

    it('default preset index points to marianne_1', () => {
      expect(HYDRA_GALLERY[getDefaultPresetIndex()].sketch_id).toBe('marianne_1')
    })
  })

  describe('navigation', () => {
    it('getNextPreset wraps around at end', () => {
      expect(getNextPreset(getPresetCount() - 1)).toBe(0)
    })

    it('getNextPreset increments normally', () => {
      expect(getNextPreset(0)).toBe(1)
    })

    it('getPrevPreset wraps around at start', () => {
      expect(getPrevPreset(0)).toBe(getPresetCount() - 1)
    })

    it('getPrevPreset decrements normally', () => {
      expect(getPrevPreset(5)).toBe(4)
    })

    it('getRandomPreset returns a different index', () => {
      const idx = getRandomPreset(0)
      expect(idx).not.toBe(0)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(getPresetCount())
    })

    it('getRandomPreset without exclude returns valid index', () => {
      const idx = getRandomPreset()
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(getPresetCount())
    })
  })
})
