/**
 * Per-preset audio injection profiles with DJB2 hash validation.
 * Depends on lib/injectedLines for stripInjectedLines.
 */
import { stripInjectedLines } from 'lib/injectedLines'

export interface AudioInjectProfile {
  modulate: number
  rotate: number
  scale: number
  colorShift: number
  saturate: number
  contrast: number
  brightness: number
}

export const DEFAULT_PROFILE: AudioInjectProfile = {
  modulate: 0.25,
  rotate: 0.08,
  scale: 0.08,
  colorShift: 0.06,
  saturate: 0.3,
  contrast: 0.2,
  brightness: 0.15,
}

/**
 * DJB2 hash → 8-char lowercase hex string.
 * Deterministic, fast, suitable for content-addressable profile matching.
 */
export function djb2Hash (str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/** Normalize code for hashing: strip injected lines, normalize line endings, trim */
export function normalizeForHash (code: string): string {
  return stripInjectedLines(code).replace(/\r\n/g, '\n').trimEnd()
}

/**
 * Hand-tuned profiles for specific sketches.
 * Each entry: { hash: djb2Hash(normalizeForHash(code)), profile }
 * If the code changes (hash mismatch), falls back to DEFAULT_PROFILE.
 */
interface ProfileEntry {
  hash: string
  profile: AudioInjectProfile
}

const PROFILE_MAP: Record<string, ProfileEntry> = {
  // Profiles can be added here as sketches are tuned.
  // Format:
  // 'sketch_id': {
  //   hash: djb2Hash(normalizeForHash(decodedSketchCode)),
  //   profile: { modulate: ..., rotate: ..., scale: ..., colorShift: ... },
  // },
}

export type InjectionLevel = 'low' | 'med' | 'high'

export const INJECTION_FACTORS: Record<InjectionLevel, number> = {
  low: 0.4,
  med: 1.0,
  high: 2.0,
}

export function scaleProfile (base: AudioInjectProfile, factor: number): AudioInjectProfile {
  return {
    modulate: base.modulate * factor,
    rotate: base.rotate * factor,
    scale: base.scale * factor,
    colorShift: base.colorShift * factor,
    saturate: base.saturate * factor,
    contrast: base.contrast * factor,
    brightness: base.brightness * factor,
  }
}

export function getProfileForSketch (sketchId: string, code: string): AudioInjectProfile {
  const entry = PROFILE_MAP[sketchId]
  if (!entry) return DEFAULT_PROFILE

  const hash = djb2Hash(normalizeForHash(code))
  if (hash !== entry.hash) return DEFAULT_PROFILE

  return entry.profile
}
