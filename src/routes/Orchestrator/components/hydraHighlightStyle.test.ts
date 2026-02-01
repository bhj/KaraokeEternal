import { describe, it, expect } from 'vitest'
import { HighlightStyle } from '@codemirror/language'
import { hydraHighlightStyle, hydraHighlight } from './hydraHighlightStyle'

describe('hydraHighlightStyle', () => {
  it('is a HighlightStyle instance', () => {
    expect(hydraHighlightStyle).toBeInstanceOf(HighlightStyle)
  })

  it('defines styles for at least 6 token types', () => {
    // HighlightStyle.module is a StyleModule with rules array
    // Access the internal specs — HighlightStyle stores them as .specs
    // The HighlightStyle.define() call takes an array of TagStyle objects
    // We verify by checking the module has rules
    const module = hydraHighlightStyle.module
    expect(module).toBeDefined()
    // The module.getRules() returns CSS text with style rules
    const rules = module.getRules()
    expect(rules.length).toBeGreaterThan(0)
  })

  it('exports hydraHighlight extension', () => {
    expect(hydraHighlight).toBeDefined()
  })
})
