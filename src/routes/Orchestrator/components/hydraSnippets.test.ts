import { describe, it, expect } from 'vitest'
import { HYDRA_SNIPPETS } from './hydraSnippets'

describe('HYDRA_SNIPPETS', () => {
  it('has exactly 3 categories: Audio, Camera, Templates', () => {
    const categories = HYDRA_SNIPPETS.map(c => c.category)
    expect(categories).toContain('Audio')
    expect(categories).toContain('Camera')
    expect(categories).toContain('Templates')
    expect(categories).toHaveLength(3)
  })

  it('every snippet has non-empty label and code', () => {
    for (const cat of HYDRA_SNIPPETS) {
      for (const s of cat.snippets) {
        expect(s.label.length, `empty label in ${cat.category}`).toBeGreaterThan(0)
        expect(s.code.length, `empty code for "${s.label}" in ${cat.category}`).toBeGreaterThan(0)
      }
    }
  })

  it('no duplicate labels across all categories', () => {
    const allLabels = HYDRA_SNIPPETS.flatMap(c => c.snippets.map(s => s.label))
    expect(new Set(allLabels).size).toBe(allLabels.length)
  })

  it('Audio category has at least 3 snippets', () => {
    const audio = HYDRA_SNIPPETS.find(c => c.category === 'Audio')
    expect(audio).toBeDefined()
    expect(audio!.snippets.length).toBeGreaterThanOrEqual(3)
  })

  it('Camera category has at least 2 snippets', () => {
    const camera = HYDRA_SNIPPETS.find(c => c.category === 'Camera')
    expect(camera).toBeDefined()
    expect(camera!.snippets.length).toBeGreaterThanOrEqual(2)
  })

  it('Templates category has at least 3 snippets', () => {
    const templates = HYDRA_SNIPPETS.find(c => c.category === 'Templates')
    expect(templates).toBeDefined()
    expect(templates!.snippets.length).toBeGreaterThanOrEqual(3)
  })
})
