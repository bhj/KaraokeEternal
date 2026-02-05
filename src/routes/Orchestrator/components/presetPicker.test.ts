import { describe, it, expect } from 'vitest'
import { buildPickerOptions, filterPickerOptions } from './presetPicker'
import type { HydraGalleryItem } from './hydraGallery'

describe('presetPicker', () => {
  it('buildPickerOptions returns options sorted by label', () => {
    const gallery: HydraGalleryItem[] = [
      { sketch_id: 'zeta', code: '' },
      { sketch_id: 'alpha', code: '' },
      { sketch_id: 'delta', code: '' },
    ]
    const options = buildPickerOptions(gallery)
    expect(options.map(o => o.label)).toEqual(['alpha', 'delta', 'zeta'])
  })

  it('filterPickerOptions matches case-insensitive substrings', () => {
    const options = [
      { label: 'marianne_1', index: 0 },
      { label: 'flor_1', index: 1 },
    ]
    const result = filterPickerOptions(options, 'Mari')
    expect(result).toEqual([{ label: 'marianne_1', index: 0 }])
  })

  it('filterPickerOptions returns all when query empty', () => {
    const options = [
      { label: 'a', index: 0 },
      { label: 'b', index: 1 },
    ]
    const result = filterPickerOptions(options, '')
    expect(result).toEqual(options)
  })
})
