/**
 * Data logic for the preset browser panel.
 * Pure functions — no React imports.
 */
import { type HydraGalleryItem } from './hydraGallery'
import { decodeSketch } from './hydraPresets'
import { detectCameraUsage } from 'lib/detectCameraUsage'
import { getProfileForSketch, DEFAULT_PROFILE } from 'routes/Player/components/Player/PlayerVisualizer/hooks/audioInjectProfiles'

export interface PresetBrowserItem {
  index: number
  sketchId: string
  tags: string[]
  hasAudioProfile: boolean
  usesCamera: boolean
}

export function buildPresetItems (gallery: HydraGalleryItem[]): PresetBrowserItem[] {
  return gallery.map((item, index) => {
    const code = decodeSketch(item)
    const { sources } = detectCameraUsage(code)
    const usesCamera = sources.length > 0
    const profile = getProfileForSketch(item.sketch_id, code)
    const hasAudioProfile = profile !== DEFAULT_PROFILE

    const tags: string[] = []
    if (usesCamera) tags.push('camera')
    if (hasAudioProfile) tags.push('tuned')

    return {
      index,
      sketchId: item.sketch_id,
      tags,
      hasAudioProfile,
      usesCamera,
    }
  })
}

export function filterPresets (
  items: PresetBrowserItem[],
  query: string,
  activeTags: string[],
): PresetBrowserItem[] {
  const q = query.toLowerCase()
  return items.filter(item => {
    if (q && !item.sketchId.toLowerCase().includes(q)) return false
    if (activeTags.length > 0 && !activeTags.every(tag => item.tags.includes(tag))) return false
    return true
  })
}
