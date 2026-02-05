import { describe, it, expect } from 'vitest'
import { HYDRA_GALLERY } from './hydraGallery'
import { buildPresetTree, type PresetFolder, type PresetItem } from './presetTree'

describe('presetTree', () => {
  it('builds gallery root and user folders', () => {
    const folders: PresetFolder[] = [
      {
        folderId: 2,
        name: 'Chill',
        authorUserId: 1,
        authorName: 'Alice',
        sortOrder: 1,
      },
      {
        folderId: 1,
        name: 'Party',
        authorUserId: 2,
        authorName: 'Bob',
        sortOrder: 0,
      },
    ]

    const presets: PresetItem[] = [
      {
        presetId: 10,
        folderId: 1,
        name: 'My Preset',
        code: 'osc(10).out()',
        authorUserId: 2,
        authorName: 'Bob',
        sortOrder: 0,
      },
    ]

    const tree = buildPresetTree(folders, presets, HYDRA_GALLERY.slice(0, 2))
    expect(tree[0].isGallery).toBe(true)
    expect(tree[0].children).toHaveLength(2)

    const party = tree.find(node => node.folderId === 1)
    expect(party).toBeDefined()
    expect(party?.children).toHaveLength(1)
    expect(party?.children[0].name).toBe('My Preset')
  })
})
