export interface SkipRegion { start: number, end: number }

export interface SkipRegionResult {
  regions: SkipRegion[]
  hasUnterminated: boolean
}

/**
 * State-machine lexer: builds skip regions (comments + string literals).
 *
 * Template literals are treated as opaque (backtick-to-backtick, no
 * ${} parsing). This is intentionally conservative: blind brace-counting
 * inside ${} desynchronizes on nested strings/comments, which would cause
 * fewer regions to be skipped (dangerous). Opaque treatment skips more
 * (safe no-op: we may miss an injection point, but never inject in wrong place).
 *
 * Returns { regions, hasUnterminated }. When hasUnterminated is true,
 * the code has broken syntax and callers should bail out.
 */
export function getSkipRegions (code: string): SkipRegionResult {
  const regions: SkipRegion[] = []
  let hasUnterminated = false
  let i = 0
  while (i < code.length) {
    // Line comment (always terminated by \n or EOF — not an error)
    if (code[i] === '/' && code[i + 1] === '/') {
      const start = i
      while (i < code.length && code[i] !== '\n') i++
      regions.push({ start, end: i })
      continue
    }
    // Block comment
    if (code[i] === '/' && code[i + 1] === '*') {
      const start = i
      i += 2
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      if (i < code.length - 1) {
        i += 2 // skip closing */
      } else {
        i = code.length // unterminated
        hasUnterminated = true
      }
      regions.push({ start, end: i })
      continue
    }
    // String literals: ", ', ` (unterminated → EOF + flag)
    if (code[i] === '"' || code[i] === '\'' || code[i] === '`') {
      const quote = code[i]
      const start = i
      i++
      let terminated = false
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2
          continue
        }
        if (code[i] === quote) {
          i++
          terminated = true
          break
        }
        i++
      }
      if (!terminated) hasUnterminated = true
      regions.push({ start, end: i })
      continue
    }
    i++
  }
  return { regions, hasUnterminated }
}
