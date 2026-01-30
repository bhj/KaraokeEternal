import { HYDRA_GALLERY, type HydraGalleryItem } from './hydraGallery'

/**
 * Decode a gallery item from base64+URI encoding.
 * Uses Buffer.from() which works in both browser (via polyfill) and Node (tests).
 */
export function decodeSketch (item: HydraGalleryItem): string {
  try {
    // atob() doesn't exist in Node test environment — use Buffer fallback
    const raw = typeof atob === 'function'
      ? atob(item.code)
      : Buffer.from(item.code, 'base64').toString('utf8')
    return decodeURIComponent(raw)
  } catch {
    return ''
  }
}

/**
 * All 58 gallery sketches decoded. Gallery is canonical — all entries must decode.
 * If any entry fails to decode, it will be an empty string (caught by integrity tests).
 */
export const PRESETS: string[] = HYDRA_GALLERY.map(item => decodeSketch(item))

/** Formatted labels: [1/58] sketch_id */
export const PRESET_LABELS: string[] = HYDRA_GALLERY.map(
  (item, i) => `[${i + 1}/${HYDRA_GALLERY.length}] ${item.sketch_id}`,
)

/** Index of mahalia_0 in the gallery (default sketch) */
export const DEFAULT_PRESET_INDEX: number = HYDRA_GALLERY.findIndex(
  item => item.sketch_id === 'mahalia_0',
)

export function getDefaultPreset (): string {
  return PRESETS[DEFAULT_PRESET_INDEX]
}

export function getDefaultPresetIndex (): number {
  return DEFAULT_PRESET_INDEX
}

export function getPresetByIndex (i: number): string {
  return PRESETS[i]
}

export function getPresetLabel (i: number): string {
  return PRESET_LABELS[i]
}

export function getPresetCount (): number {
  return PRESETS.length
}

export function getNextPreset (i: number): number {
  return (i + 1) % PRESETS.length
}

export function getPrevPreset (i: number): number {
  return (i - 1 + PRESETS.length) % PRESETS.length
}

export function getRandomPreset (excludeIndex?: number): number {
  if (excludeIndex == null) {
    return Math.floor(Math.random() * PRESETS.length)
  }
  const idx = Math.floor(Math.random() * (PRESETS.length - 1))
  return idx >= excludeIndex ? idx + 1 : idx
}
