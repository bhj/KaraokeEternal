import { describe, it, expect } from 'vitest'
import { buildHydraCompletions } from './hydraCompletions'

describe('buildHydraCompletions', () => {
  const { topLevel, dotChain, nativeAudioDot } = buildHydraCompletions()

  it('topLevel includes 8 source functions', () => {
    const sources = ['osc', 'noise', 'voronoi', 'shape', 'gradient', 'solid', 'src', 'prev']
    for (const name of sources) {
      expect(topLevel.some(c => c.label === name), `missing source: ${name}`).toBe(true)
    }
  })

  it('topLevel excludes legacy audio helper functions', () => {
    const legacy = ['bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright']
    for (const name of legacy) {
      expect(topLevel.some(c => c.label === name), `unexpected legacy audio helper: ${name}`).toBe(false)
    }
  })

  it('topLevel includes 4 native audio API entries', () => {
    const native = ['a.fft', 'a.setBins', 'a.setSmooth', 'a.setScale']
    for (const name of native) {
      expect(topLevel.some(c => c.label === name), `missing native audio: ${name}`).toBe(true)
    }
  })

  it('dotChain includes transforms, color, combine, modulate, and .out', () => {
    expect(dotChain.some(c => c.label === '.rotate'), 'missing .rotate').toBe(true)
    expect(dotChain.some(c => c.label === '.color'), 'missing .color').toBe(true)
    expect(dotChain.some(c => c.label === '.add'), 'missing .add').toBe(true)
    expect(dotChain.some(c => c.label === '.modulate'), 'missing .modulate').toBe(true)
    expect(dotChain.some(c => c.label === '.out'), 'missing .out').toBe(true)
  })

  it('completions have detail and section', () => {
    for (const c of topLevel) {
      expect(typeof c.detail, `${c.label} missing detail`).toBe('string')
      expect(typeof c.section, `${c.label} missing section`).toBe('string')
    }
    for (const c of dotChain) {
      expect(typeof c.detail, `${c.label} missing detail`).toBe('string')
      expect(typeof c.section, `${c.label} missing section`).toBe('string')
    }
  })

  it('completions include teaching info strings', () => {
    for (const c of topLevel) {
      const info = (c as { info?: string }).info
      expect(typeof info, `${c.label} missing info`).toBe('string')
      expect(info?.trim().length, `${c.label} empty info`).toBeGreaterThan(0)
    }
    for (const c of dotChain) {
      const info = (c as { info?: string }).info
      expect(typeof info, `${c.label} missing info`).toBe('string')
      expect(info?.trim().length, `${c.label} empty info`).toBeGreaterThan(0)
    }
    for (const c of nativeAudioDot) {
      const info = (c as { info?: string }).info
      expect(typeof info, `${c.label} missing info`).toBe('string')
      expect(info?.trim().length, `${c.label} empty info`).toBeGreaterThan(0)
    }
  })

  it('no duplicates in topLevel', () => {
    const labels = topLevel.map(c => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('no duplicates in dotChain', () => {
    const labels = dotChain.map(c => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('nativeAudioDot has 4 entries for a. completions', () => {
    expect(nativeAudioDot).toHaveLength(4)
    const labels = nativeAudioDot.map(c => c.label)
    expect(labels).toContain('fft')
    expect(labels).toContain('setBins')
    expect(labels).toContain('setSmooth')
    expect(labels).toContain('setScale')
  })

  it('nativeAudioDot entries have no a. prefix (CM6 keeps typed prefix)', () => {
    for (const c of nativeAudioDot) {
      expect(c.label.startsWith('a.')).toBe(false)
    }
  })
})

describe('buildHydraCompletions - camera / external sources', () => {
  const { topLevel, sourceDot } = buildHydraCompletions()

  it('sourceDot has initCam, initImage, initVideo, initScreen', () => {
    const labels = sourceDot.map(c => c.label)
    expect(labels).toContain('initCam')
    expect(labels).toContain('initImage')
    expect(labels).toContain('initVideo')
    expect(labels).toContain('initScreen')
  })

  it('sourceDot entries have no sN. prefix (CM6 keeps typed prefix)', () => {
    for (const c of sourceDot) {
      expect(c.label).not.toMatch(/^s\d\./)
    }
  })

  it('topLevel does NOT include s0.initCam (no duplication with sourceDot)', () => {
    expect(topLevel.some(c => c.label === 's0.initCam')).toBe(false)
    expect(topLevel.some(c => c.label === 's1.initCam')).toBe(false)
    expect(topLevel.some(c => c.label === 'initCam')).toBe(false)
  })

  it('sourceDot entries have detail and section', () => {
    for (const c of sourceDot) {
      expect(typeof c.detail, `${c.label} missing detail`).toBe('string')
      expect(typeof c.section, `${c.label} missing section`).toBe('string')
    }
  })

  it('sourceDot entries include teaching info', () => {
    for (const c of sourceDot) {
      const info = (c as { info?: string }).info
      expect(typeof info, `${c.label} missing info`).toBe('string')
      expect(info?.trim().length, `${c.label} empty info`).toBeGreaterThan(0)
    }
  })

  it('no duplicates in sourceDot', () => {
    const labels = sourceDot.map(c => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
