import { getSkipRegions } from 'lib/skipRegions'

export interface LintDiagnostic {
  from: number
  to: number
  severity: 'error' | 'warning'
  message: string
}

/**
 * Lint Hydra code for common syntax issues.
 * Uses getSkipRegions to avoid false positives inside strings/comments.
 */
export function lintHydraCode (code: string): LintDiagnostic[] {
  const { regions, hasUnterminated } = getSkipRegions(code)
  const diagnostics: LintDiagnostic[] = []

  if (hasUnterminated) {
    // Find the last region — it's the unterminated one
    const last = regions[regions.length - 1]
    if (last) {
      const startChar = code[last.start]
      let label: string
      if (startChar === '/' && code[last.start + 1] === '*') {
        label = 'block comment'
      } else if (startChar === '"') {
        label = 'double-quoted string'
      } else if (startChar === '\'') {
        label = 'single-quoted string'
      } else if (startChar === '`') {
        label = 'template literal'
      } else {
        label = 'literal'
      }
      diagnostics.push({
        from: last.start,
        to: last.end,
        severity: 'error',
        message: `Unterminated ${label}`,
      })
    }
    return diagnostics
  }

  // Check balanced parens/brackets outside skip regions
  const openers: Array<{ char: string, pos: number }> = []
  const pairs: Record<string, string> = { '(': ')', '[': ']' }
  const closers: Record<string, string> = { ')': '(', ']': '[' }
  const names: Record<string, string> = { '(': 'paren', ')': 'paren', '[': 'bracket', ']': 'bracket' }

  for (let i = 0; i < code.length; i++) {
    // Skip if inside a skip region
    if (regions.some(r => i >= r.start && i < r.end)) continue

    const ch = code[i]
    if (pairs[ch]) {
      openers.push({ char: ch, pos: i })
    } else if (closers[ch]) {
      const expected = closers[ch]
      if (openers.length > 0 && openers[openers.length - 1].char === expected) {
        openers.pop()
      } else {
        diagnostics.push({
          from: i,
          to: i + 1,
          severity: 'error',
          message: `Unmatched closing ${names[ch]}`,
        })
      }
    }
  }

  for (const opener of openers) {
    diagnostics.push({
      from: opener.pos,
      to: opener.pos + 1,
      severity: 'error',
      message: `Unmatched opening ${names[opener.char]}`,
    })
  }

  return diagnostics
}
