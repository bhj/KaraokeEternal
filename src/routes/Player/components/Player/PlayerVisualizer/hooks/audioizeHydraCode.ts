import { getSkipRegions, type SkipRegion } from 'lib/skipRegions'
import { stripInjectedLines } from 'lib/injectedLines'
import { DEFAULT_PROFILE, type AudioInjectProfile } from './audioInjectProfiles'

const AUDIO_PATTERNS = [
  /bass\s*\(/, /mid\s*\(/, /treble\s*\(/, /beat\s*\(/,
  /bpm\s*\(/, /energy\s*\(/, /bright\s*\(/,
  /a\.fft/, /a\.setBins/, /a\.setSmooth/, /a\.setScale/,
]

const isDev = process.env.NODE_ENV !== 'production'

const log = isDev
  ? (...args: unknown[]) => console.log('[audioize]', ...args)
  : () => {}

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

export function audioizeHydraCode (code: string, profile?: AudioInjectProfile): string {
  const p = profile ?? DEFAULT_PROFILE

  // If a different profile is requested, strip existing injection first
  if (profile) {
    code = stripInjectedLines(code)
  }

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
    = `\n  .modulate(osc(3, 0.05), () => a.fft[0] * ${p.modulate})`
      + `\n  .rotate(() => a.fft[1] * ${p.rotate})`
      + `\n  .scale(() => 0.95 + a.fft[2] * ${p.scale})`
      + `\n  .color(1, 1 - a.fft[3] * ${p.colorShift}, 1 + a.fft[3] * ${p.colorShift})`
      + '\n  '

  return code.slice(0, insertMatch.index) + audioChain + code.slice(insertMatch.index)
}
