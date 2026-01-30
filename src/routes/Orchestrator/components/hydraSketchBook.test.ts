import { describe, it, expect } from 'vitest'
import { DEFAULT_SKETCH, SKETCHES, getRandomSketch } from './hydraSketchBook'

describe('hydraSketchBook', () => {
  describe('DEFAULT_SKETCH', () => {
    it('is a non-empty string', () => {
      expect(DEFAULT_SKETCH.length).toBeGreaterThan(0)
    })

    it('contains at least one audio global', () => {
      const audioGlobals = ['bass()', 'mid()', 'treble()', 'beat()', 'energy()', 'bpm()', 'bright()']
      const hasAudio = audioGlobals.some(g => DEFAULT_SKETCH.includes(g))
      expect(hasAudio).toBe(true)
    })

    it('contains .out()', () => {
      expect(DEFAULT_SKETCH).toContain('.out()')
    })
  })

  describe('SKETCHES', () => {
    it('has at least 10 sketches', () => {
      expect(SKETCHES.length).toBeGreaterThanOrEqual(10)
    })

    it('every sketch contains .out()', () => {
      for (const sketch of SKETCHES) {
        expect(sketch).toContain('.out()')
      }
    })

    it('every sketch uses at least one audio global', () => {
      const audioGlobals = ['bass()', 'mid()', 'treble()', 'beat()', 'energy()', 'bpm()', 'bright()']
      for (const sketch of SKETCHES) {
        const hasAudio = audioGlobals.some(g => sketch.includes(g))
        expect(hasAudio, `Sketch missing audio global:\n${sketch}`).toBe(true)
      }
    })
  })

  describe('getRandomSketch', () => {
    it('returns a sketch different from current', () => {
      const current = SKETCHES[0]
      const result = getRandomSketch(current)
      expect(result).not.toBe(current)
      expect(result.length).toBeGreaterThan(0)
    })

    it('same seed + counter produces same result', () => {
      const a = getRandomSketch(undefined, 42, 1)
      const b = getRandomSketch(undefined, 42, 1)
      expect(a).toBe(b)
    })

    it('different counter produces different result', () => {
      const a = getRandomSketch(undefined, 42, 1)
      const b = getRandomSketch(undefined, 42, 2)
      // With enough sketches, different counters should yield different results
      // (not guaranteed but highly likely with a good hash)
      expect(a).not.toBe(b)
    })

    it('falls back gracefully when seed is null/undefined', () => {
      const result = getRandomSketch(undefined, undefined, 0)
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns a valid sketch from the collection', () => {
      const result = getRandomSketch(undefined, 99, 5)
      expect(SKETCHES).toContain(result)
    })
  })
})
