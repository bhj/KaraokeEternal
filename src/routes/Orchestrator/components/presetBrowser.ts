/**
 * Data logic for the preset browser panel.
 * Pure functions — no React imports.
 */
import { type HydraGalleryItem } from './hydraGallery'
import { decodeSketch } from './hydraPresets'
import { detectCameraUsage } from 'lib/detectCameraUsage'
import { getProfileForSketch, DEFAULT_PROFILE } from 'routes/Player/components/Player/PlayerVisualizer/hooks/audioInjectProfiles'
import { classifyPreset, type PresetCategory } from 'routes/Player/components/Player/PlayerVisualizer/hooks/presetClassifier'

export interface PresetBrowserItem {
  index: number
  sketchId: string
  tags: string[]
  hasAudioProfile: boolean
  usesCamera: boolean
  category: PresetCategory
}

export function buildPresetItems (gallery: HydraGalleryItem[]): PresetBrowserItem[] {
  return gallery.map((item, index) => {
    const code = decodeSketch(item)
    const { sources } = detectCameraUsage(code)
    const usesCamera = sources.length > 0
    const profile = getProfileForSketch(item.sketch_id, code)
    const hasAudioProfile = profile !== DEFAULT_PROFILE

    const category = classifyPreset(code)

    const tags: string[] = []
    if (category !== 'default') tags.push(category)
    if (hasAudioProfile) tags.push('tuned')

    return {
      index,
      sketchId: item.sketch_id,
      tags,
      hasAudioProfile,
      usesCamera,
      category,
    }
  })
}

export function filterPresets (
  items: PresetBrowserItem[],
  query: string,
  activeTags: string[],
): PresetBrowserItem[] {
  const q = query.toLowerCase()
  return items.filter((item) => {
    if (q && !item.sketchId.toLowerCase().includes(q)) return false
    if (activeTags.length > 0 && !activeTags.every(tag => item.tags.includes(tag))) return false
    return true
  })
}
