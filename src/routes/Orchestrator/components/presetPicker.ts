/**
 * Data logic for the compact preset picker in StagePanel header.
 * Reuses HYDRA_GALLERY/decodeSketch — no duplicated gallery data.
 */
import { HYDRA_GALLERY } from './hydraGallery'
import { decodeSketch } from './hydraPresets'

export interface PickerOption {
  label: string
  index: number
  code: string
}

export function buildPickerOptions (): PickerOption[] {
  return HYDRA_GALLERY.map((item, index) => ({
    label: item.sketch_id,
    index,
    code: decodeSketch(item),
  }))
}

export function filterPickerOptions (options: PickerOption[], query: string): PickerOption[] {
  if (!query) return options
  const q = query.toLowerCase()
  return options.filter(opt => opt.label.toLowerCase().includes(q))
}
