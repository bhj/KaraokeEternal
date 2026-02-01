import { describe, it, expect } from 'vitest'
import { buildHydraCompletions } from './hydraCompletions'

describe('buildHydraCompletions', () => {
  const { topLevel, dotChain } = buildHydraCompletions()

  it('topLevel includes 8 source functions', () => {
    const sources = ['osc', 'noise', 'voronoi', 'shape', 'gradient', 'solid', 'src', 'prev']
    for (const name of sources) {
      expect(topLevel.some(c => c.label === name), `missing source: ${name}`).toBe(true)
    }
  })

  it('topLevel includes 7 audio helper functions', () => {
    const audio = ['bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright']
    for (const name of audio) {
      expect(topLevel.some(c => c.label === name), `missing audio: ${name}`).toBe(true)
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

  it('no duplicates in topLevel', () => {
    const labels = topLevel.map(c => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('no duplicates in dotChain', () => {
    const labels = dotChain.map(c => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
