export type StageBuffer = 'auto' | 'o0' | 'o1' | 'o2' | 'o3'

export const BUFFER_OPTIONS: { key: StageBuffer, label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: 'o0', label: 'o0' },
  { key: 'o1', label: 'o1' },
  { key: 'o2', label: 'o2' },
  { key: 'o3', label: 'o3' },
]

/**
 * Detect the output buffer a sketch renders to.
 *
 * Precedence: render(oN) > render() > last .out(oN) > 'o0'
 *
 * Strips single-line (//) and block comments before scanning.
 * Known limitation: string literals containing .out() are not stripped
 * (rare in Hydra sketches — documented, not mitigated).
 */
export function detectOutputBuffer (code: string): string {
  // Strip comments to avoid false matches in commented-out code
  const stripped = code
    .replace(/\/\/[^\n]*/g, '') // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments (non-greedy)

  // Check for explicit render(oN) — highest precedence
  const renderMatch = stripped.match(/render\((o[0-3])\)/g)
  if (renderMatch) {
    const last = renderMatch[renderMatch.length - 1]
    const bufMatch = last.match(/render\((o[0-3])\)/)
    if (bufMatch) return bufMatch[1]
  }

  // render() with no arg → o0 (Hydra grid mode, we render o0 in preview)
  if (/render\(\s*\)/.test(stripped)) {
    return 'o0'
  }

  // Last .out(oN) with explicit buffer
  const outMatches = stripped.match(/\.out\((o[0-3])\)/g)
  if (outMatches) {
    const last = outMatches[outMatches.length - 1]
    const bufMatch = last.match(/\.out\((o[0-3])\)/)
    if (bufMatch) return bufMatch[1]
  }

  // .out() with no arg or no match → o0
  return 'o0'
}

/**
 * Build preview code by appending a render() call.
 *
 * NOTE: This overrides any user render() call in the code.
 * Preview != runtime — this is intentional for the preview panel.
 */
export function buildPreviewCode (code: string, buffer: StageBuffer): string {
  const trimmed = code.trim()
  if (!trimmed) return ''

  if (buffer === 'auto') {
    const target = detectOutputBuffer(trimmed)
    return `${trimmed}\nrender(${target})`
  }

  return `${trimmed}\nrender(${buffer})`
}
