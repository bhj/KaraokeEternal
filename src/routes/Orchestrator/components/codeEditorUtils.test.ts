import { describe, it, expect } from 'vitest'
import { getLintErrorSummary } from './codeEditorUtils'

describe('getLintErrorSummary', () => {
  it('returns null when no lint errors', () => {
    const code = 'osc(10)\n  .out()'
    expect(getLintErrorSummary(code)).toBeNull()
  })

  it('returns error count + first line for unterminated string', () => {
    const code = 'osc("unterminated)\n  .out()'
    const summary = getLintErrorSummary(code)
    expect(summary).not.toBeNull()
    expect(summary?.count).toBeGreaterThan(0)
    expect(summary?.firstLine).toBe(1)
  })
})
