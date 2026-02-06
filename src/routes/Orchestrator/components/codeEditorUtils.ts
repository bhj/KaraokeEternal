import { lintHydraCode } from './hydraLint'

export interface LintErrorSummary {
  count: number
  firstLine: number
  debugHint: string
}

function getLineNumber (code: string, index: number): number {
  if (index <= 0) return 1
  return code.slice(0, index).split('\n').length
}

function buildDebugHint (message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('unterminated')) {
    return `Debug: ${message}. Check matching quotes, backticks, and block comments.`
  }
  if (lower.includes('unmatched closing')) {
    return `Debug: ${message}. Remove an extra closing bracket/paren near this line.`
  }
  if (lower.includes('unmatched opening')) {
    return `Debug: ${message}. Add the missing closing bracket/paren before send.`
  }
  return `Debug: ${message}. Review nearby syntax before sending.`
}

export function getLintErrorSummary (code: string): LintErrorSummary | null {
  const errors = lintHydraCode(code).filter(d => d.severity === 'error')
  if (errors.length === 0) return null
  const first = errors[0]
  return {
    count: errors.length,
    firstLine: getLineNumber(code, first.from),
    debugHint: buildDebugHint(first.message),
  }
}

/**
 * Lightweight formatter for Hydra editor content.
 * - normalizes line endings to LF
 * - trims trailing whitespace per line
 * - collapses 3+ blank lines down to one blank line
 * - trims trailing blank lines at file end
 */
export function formatHydraCode (code: string): string {
  const normalized = code
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
  return normalized.replace(/\n+$/g, '')
}
