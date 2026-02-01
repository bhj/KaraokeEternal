import { describe, it, expect } from 'vitest'
import { lintHydraCode } from './hydraLint'

describe('lintHydraCode', () => {
  it('returns empty diagnostics for valid code', () => {
    const result = lintHydraCode('osc(10).out()')
    expect(result).toEqual([])
  })

  it('reports unterminated " string', () => {
    const result = lintHydraCode('var x = "unterminated')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].message).toMatch(/unterminated/i)
  })

  it('reports unterminated /* comment', () => {
    const result = lintHydraCode('/* unterminated comment')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].message).toMatch(/unterminated/i)
  })

  it('reports unterminated backtick', () => {
    const result = lintHydraCode('var x = `unterminated')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].message).toMatch(/unterminated/i)
  })

  it('reports unbalanced opening paren', () => {
    const result = lintHydraCode('osc(10')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].message).toMatch(/paren/i)
  })

  it('reports unbalanced closing bracket', () => {
    const result = lintHydraCode('osc(10).out()]')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].message).toMatch(/bracket/i)
  })

  it('ignores parens inside strings', () => {
    const result = lintHydraCode('var x = "((("\nosc(10).out()')
    expect(result).toEqual([])
  })

  it('ignores parens inside comments', () => {
    const result = lintHydraCode('// (((\nosc(10).out()')
    expect(result).toEqual([])
  })

  it('diagnostics have from/to positions', () => {
    const result = lintHydraCode('osc(10')
    expect(result.length).toBeGreaterThan(0)
    expect(typeof result[0].from).toBe('number')
    expect(typeof result[0].to).toBe('number')
  })
})
