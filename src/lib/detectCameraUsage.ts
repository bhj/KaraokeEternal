/**
 * Detect camera/external source usage in Hydra code.
 * Shared utility — imports only from lib/skipRegions.
 * No cross-route imports (no Player/Orchestrator deps).
 */
import { getSkipRegions, type SkipRegion } from 'lib/skipRegions'

export interface CameraUsageResult {
  /** Which external sources (s0–s3) are referenced via src() */
  sources: string[]
  /** Whether any sN.initCam/initImage/initVideo/initScreen call is present */
  hasExplicitInit: boolean
}

function isInSkipRegion (pos: number, regions: readonly SkipRegion[]): boolean {
  return regions.some(r => pos >= r.start && pos < r.end)
}

const SRC_PATTERN = /\bsrc\s*\(\s*(s[0-3])\s*\)/g
const INIT_PATTERN = /\bs[0-3]\.(initCam|initImage|initVideo|initScreen)\s*\(/g

export function detectCameraUsage (code: string): CameraUsageResult {
  const { regions } = getSkipRegions(code)
  const sourceSet = new Set<string>()
  let hasExplicitInit = false

  // Find src(sN) references outside skip regions
  let m: RegExpExecArray | null
  const srcRe = new RegExp(SRC_PATTERN.source, 'g')
  while ((m = srcRe.exec(code)) !== null) {
    if (!isInSkipRegion(m.index, regions)) {
      sourceSet.add(m[1])
    }
  }

  // Find sN.init*() calls outside skip regions
  const initRe = new RegExp(INIT_PATTERN.source, 'g')
  while ((m = initRe.exec(code)) !== null) {
    if (!isInSkipRegion(m.index, regions)) {
      hasExplicitInit = true
    }
  }

  const sources = Array.from(sourceSet).sort()
  return { sources, hasExplicitInit }
}
