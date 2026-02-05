import { lintHydraCode } from './hydraLint'

export interface LintErrorSummary {
  count: number
  firstLine: number
}

function getLineNumber (code: string, index: number): number {
  if (index <= 0) return 1
  return code.slice(0, index).split('\n').length
}

export function getLintErrorSummary (code: string): LintErrorSummary | null {
  const errors = lintHydraCode(code).filter(d => d.severity === 'error')
  if (errors.length === 0) return null
  const first = errors[0]
  return {
    count: errors.length,
    firstLine: getLineNumber(code, first.from),
  }
}
