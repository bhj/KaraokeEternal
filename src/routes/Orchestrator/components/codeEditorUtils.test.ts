import { describe, it, expect } from 'vitest'
import { formatHydraCode, getLintErrorSummary } from './codeEditorUtils'

describe('getLintErrorSummary', () => {
  it('returns null when no lint errors', () => {
    const code = 'osc(10)\n  .out()'
    expect(getLintErrorSummary(code)).toBeNull()
  })

  it('returns error count + first line + debug hint for unterminated string', () => {
    const code = 'osc("unterminated)\n  .out()'
    const summary = getLintErrorSummary(code)
    expect(summary).not.toBeNull()
    expect(summary?.count).toBeGreaterThan(0)
    expect(summary?.firstLine).toBe(1)
    expect(summary?.debugHint).toContain('Debug:')
    expect(summary?.debugHint.toLowerCase()).toContain('unterminated')
  })
})

describe('formatHydraCode', () => {
  it('normalizes CRLF, trims trailing spaces, and trims trailing blank lines', () => {
    const raw = 'osc(10)  \r\n  .out()  \r\n\r\n'
    expect(formatHydraCode(raw)).toBe('osc(10)\n  .out()')
  })

  it('collapses excessive blank lines to a single blank line', () => {
    const raw = 'osc(10)\n\n\n\nnoise(3)\n  .out()\n'
    expect(formatHydraCode(raw)).toBe('osc(10)\n\nnoise(3)\n  .out()')
  })
})
