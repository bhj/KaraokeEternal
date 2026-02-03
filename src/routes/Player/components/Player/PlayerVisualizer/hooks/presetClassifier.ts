/**
 * Classify Hydra presets into categories for audio injection strategy.
 * Uses heuristics (regex + parenthesis depth) to determine the best
 * injection chain that won't conflict with the preset's visual style.
 */
import { detectCameraUsage } from 'lib/detectCameraUsage'
import { getSkipRegions, type SkipRegion } from 'lib/skipRegions'
import type { AudioInjectProfile } from './audioInjectProfiles'

export type PresetCategory = 'camera' | 'feedback' | 'kaleid' | 'default'

function isInSkipRegion (pos: number, regions: readonly SkipRegion[]): boolean {
  return regions.some(r => pos >= r.start && pos < r.end)
}

/**
 * Detect top-level src(oN) self-references (feedback loops).
 * "Top-level" means paren depth 0 — not nested inside .layer(), .mult(), etc.
 * Only counts src(oN) where N matches an output buffer (o0–o3).
 */
function hasFeedbackAtTopLevel (code: string, regions: readonly SkipRegion[]): boolean {
  const SRC_OUTPUT_RE = /\bsrc\s*\(\s*(o[0-3])\s*\)/g
  let m: RegExpExecArray | null
  const re = new RegExp(SRC_OUTPUT_RE.source, 'g')

  while ((m = re.exec(code)) !== null) {
    if (isInSkipRegion(m.index, regions)) continue

    // Check parenthesis depth at match position (excluding skip regions)
    let depth = 0
    for (let i = 0; i < m.index; i++) {
      if (isInSkipRegion(i, regions)) continue
      if (code[i] === '(') depth++
      else if (code[i] === ')') depth--
    }

    // depth 0 = top-level chain start, not nested inside .layer() etc.
    if (depth === 0) return true
  }
  return false
}

/**
 * Detect .kaleid( usage outside skip regions.
 */
function hasKaleidOutsideSkipRegions (code: string, regions: readonly SkipRegion[]): boolean {
  const KALEID_RE = /\.kaleid\s*\(/g
  let m: RegExpExecArray | null
  const re = new RegExp(KALEID_RE.source, 'g')

  while ((m = re.exec(code)) !== null) {
    if (!isInSkipRegion(m.index, regions)) return true
  }
  return false
}

/**
 * Classify a Hydra preset into a category for injection strategy.
 *
 * Priority: camera > feedback > kaleid > default
 *
 * - **camera**: Uses external source (s0–s3) via detectCameraUsage
 * - **feedback**: Top-level src(oN) self-reference (not nested in .layer())
 * - **kaleid**: Uses .kaleid() outside comments/strings
 * - **default**: Everything else — gets the standard 4-line chain
 */
export function classifyPreset (code: string): PresetCategory {
  const { regions } = getSkipRegions(code)

  // Camera takes highest priority
  const { sources } = detectCameraUsage(code)
  if (sources.length > 0) return 'camera'

  // Feedback: src(oN) at top level (not inside .layer() etc.)
  if (hasFeedbackAtTopLevel(code, regions)) return 'feedback'

  // Kaleid
  if (hasKaleidOutsideSkipRegions(code, regions)) return 'kaleid'

  return 'default'
}

/**
 * Generate the injection chain string for a given category and profile.
 * Each chain uses different Hydra transforms appropriate to the preset style.
 */
export function getInjectionChain (category: PresetCategory, p: AudioInjectProfile): string {
  switch (category) {
    case 'camera':
      return `\n  .saturate(() => 1 + a.fft[0] * ${p.saturate})`
        + `\n  .contrast(() => 1 + a.fft[1] * ${p.contrast})`
        + '\n  '

    case 'feedback':
      return `\n  .brightness(() => a.fft[0] * ${p.brightness})`
        + `\n  .contrast(() => 1 + a.fft[1] * ${p.contrast})`
        + '\n  '

    case 'kaleid':
      return `\n  .brightness(() => a.fft[0] * ${p.brightness})`
        + `\n  .color(1, 1 - a.fft[1] * ${p.colorShift}, 1 + a.fft[1] * ${p.colorShift})`
        + '\n  '

    case 'default':
      return `\n  .modulate(osc(3, 0.05), () => a.fft[0] * ${p.modulate})`
        + `\n  .rotate(() => a.fft[1] * ${p.rotate})`
        + `\n  .scale(() => 0.95 + a.fft[2] * ${p.scale})`
        + `\n  .color(1, 1 - a.fft[3] * ${p.colorShift}, 1 + a.fft[3] * ${p.colorShift})`
        + '\n  '
  }
}
