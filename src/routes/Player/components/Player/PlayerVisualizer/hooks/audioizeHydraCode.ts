const AUDIO_PATTERNS = [
  /bass\s*\(/, /mid\s*\(/, /treble\s*\(/, /beat\s*\(/,
  /bpm\s*\(/, /energy\s*\(/, /bright\s*\(/,
  /a\.fft/, /a\.setBins/, /a\.setSmooth/, /a\.setScale/,
]

export interface SkipRegion { start: number, end: number }

export interface SkipRegionResult {
  regions: SkipRegion[]
  hasUnterminated: boolean
}

const isDev = process.env.NODE_ENV !== 'production'

const log = isDev
  ? (...args: unknown[]) => console.log('[audioize]', ...args)
  : () => {}

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

function isInSkipRegion (pos: number, regions: readonly SkipRegion[]): boolean {
  return regions.some(r => pos >= r.start && pos < r.end)
}

/**
 * Check if code contains audio API usage outside skip regions.
 * Accepts pre-computed regions to avoid double-parsing.
 */
export function hasAudioUsage (code: string, regions: readonly SkipRegion[]): boolean {
  // Replace skip regions with spaces (preserves indices), then test patterns
  let cleaned = code
  for (let j = regions.length - 1; j >= 0; j--) {
    const r = regions[j]
    cleaned = cleaned.slice(0, r.start) + ' '.repeat(r.end - r.start) + cleaned.slice(r.end)
  }
  return AUDIO_PATTERNS.some(p => p.test(cleaned))
}

const RENDER_REGEX = /render\s*\(\s*(o[0-3])?\s*\)/g
const OUT_REGEX = /\.out\s*\(\s*(o[0-3])?\s*\)/g

function findRenderTarget (code: string, regions: readonly SkipRegion[]): string {
  let target = 'o0'
  let m: RegExpExecArray | null
  const re = new RegExp(RENDER_REGEX.source, 'g')
  while ((m = re.exec(code)) !== null) {
    if (!isInSkipRegion(m.index, regions)) {
      target = m[1] ?? 'o0'
    }
  }
  return target
}

export function audioizeHydraCode (code: string): string {
  // Single getSkipRegions call — reused by detection and injection
  const { regions, hasUnterminated } = getSkipRegions(code)

  // Broken syntax → can't reliably locate .out() → bail out
  if (hasUnterminated) {
    log('unterminated string/comment — skipping injection')
    return code
  }

  if (hasAudioUsage(code, regions)) return code

  const target = findRenderTarget(code, regions)

  const matches: Array<{ index: number, buffer: string }> = []
  let m: RegExpExecArray | null
  const re = new RegExp(OUT_REGEX.source, 'g')
  while ((m = re.exec(code)) !== null) {
    if (!isInSkipRegion(m.index, regions)) {
      matches.push({ index: m.index, buffer: m[1] ?? 'o0' })
    }
  }
  if (matches.length === 0) {
    log('no injection point found (no .out() outside skip regions)')
    return code
  }

  // Find last .out() matching the render target — NO fallback
  let insertMatch: { index: number } | undefined
  for (let j = matches.length - 1; j >= 0; j--) {
    if (matches[j].buffer === target) {
      insertMatch = matches[j]
      break
    }
  }
  if (!insertMatch) {
    log(`no injection point found (no .out(${target}) match)`)
    return code
  }

  const audioChain
    = '\n  .modulate(osc(3, 0.05), () => bass() * 0.15)'
      + '\n  .rotate(() => mid() * 0.03)'

  return code.slice(0, insertMatch.index) + audioChain + code.slice(insertMatch.index)
}
