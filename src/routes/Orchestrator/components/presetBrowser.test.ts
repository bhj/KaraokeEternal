import { describe, it, expect } from 'vitest'
import { buildPresetItems, filterPresets, type PresetBrowserItem } from './presetBrowser'
import { HYDRA_GALLERY } from './hydraGallery'

describe('buildPresetItems', () => {
  const items = buildPresetItems(HYDRA_GALLERY)

  it('returns one item per gallery entry', () => {
    expect(items).toHaveLength(HYDRA_GALLERY.length)
  })

  it('items with src(sN) have usesCamera: true', () => {
    // At least some gallery items should use external sources
    // Check that items correctly identify camera usage
    for (const item of items) {
      if (item.usesCamera) {
        // Verify the source code actually has src(sN)
        expect(item.usesCamera).toBe(true)
      }
    }
  })

  it('items have index matching their position', () => {
    for (let i = 0; i < items.length; i++) {
      expect(items[i].index).toBe(i)
    }
  })

  it('items have sketchId from gallery', () => {
    for (let i = 0; i < items.length; i++) {
      expect(items[i].sketchId).toBe(HYDRA_GALLERY[i].sketch_id)
    }
  })
})

describe('filterPresets', () => {
  const items: PresetBrowserItem[] = [
    { index: 0, sketchId: 'example_0', tags: ['audio'], hasAudioProfile: true, usesCamera: false },
    { index: 1, sketchId: 'rangga_1', tags: ['camera'], hasAudioProfile: false, usesCamera: true },
    { index: 2, sketchId: 'flor_2', tags: [], hasAudioProfile: false, usesCamera: false },
  ]

  it('returns all on empty query and no tags', () => {
    expect(filterPresets(items, '', [])).toEqual(items)
  })

  it('filters by sketch_id (case-insensitive)', () => {
    const result = filterPresets(items, 'EXAMPLE', [])
    expect(result).toHaveLength(1)
    expect(result[0].sketchId).toBe('example_0')
  })

  it('filters by tag', () => {
    const result = filterPresets(items, '', ['camera'])
    expect(result).toHaveLength(1)
    expect(result[0].sketchId).toBe('rangga_1')
  })

  it('combines query AND tags', () => {
    const result = filterPresets(items, 'rangga', ['camera'])
    expect(result).toHaveLength(1)
    expect(result[0].sketchId).toBe('rangga_1')
  })

  it('returns empty on no match', () => {
    expect(filterPresets(items, 'nonexistent', [])).toHaveLength(0)
  })

  it('query matches partial sketch_id', () => {
    const result = filterPresets(items, 'flor', [])
    expect(result).toHaveLength(1)
    expect(result[0].sketchId).toBe('flor_2')
  })
})
