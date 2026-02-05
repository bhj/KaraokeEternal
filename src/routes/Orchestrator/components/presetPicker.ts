import type { HydraGalleryItem } from './hydraGallery'

export interface PickerOption {
  label: string
  index: number
}

export function buildPickerOptions (gallery: HydraGalleryItem[]): PickerOption[] {
  return gallery
    .map((item, index) => ({ label: item.sketch_id, index }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function filterPickerOptions (options: PickerOption[], query: string): PickerOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter(option => option.label.toLowerCase().includes(q))
}
