import { describe, expect, it } from 'vitest'
import type { PresetTreeNode } from './presetTree'
import { scopePresetTreeForRoom } from './presetScope'

function makeNodes (): PresetTreeNode[] {
  return [
    {
      id: 'gallery',
      name: 'Gallery',
      isGallery: true,
      children: [
        {
          id: 'gallery:1',
          name: 'example',
          code: 'osc(10).out()',
          isGallery: true,
          usesCamera: false,
        },
      ],
    },
    {
      id: 'folder:10',
      folderId: 10,
      name: 'Party Gold',
      isGallery: false,
      children: [
        {
          id: 'preset:10',
          presetId: 10,
          folderId: 10,
          name: 'gold_1',
          code: 'osc(5).out()',
          isGallery: false,
          usesCamera: false,
        },
      ],
    },
    {
      id: 'folder:11',
      folderId: 11,
      name: 'Other',
      isGallery: false,
      children: [
        {
          id: 'preset:11',
          presetId: 11,
          folderId: 11,
          name: 'other_1',
          code: 'noise(3).out()',
          isGallery: false,
          usesCamera: false,
        },
      ],
    },
  ]
}

describe('scopePresetTreeForRoom', () => {
  it('keeps full tree for privileged users', () => {
    const nodes = makeNodes()
    const result = scopePresetTreeForRoom(nodes, {
      isPrivileged: true,
      roomPrefs: {
        restrictCollaboratorsToPartyPresetFolder: true,
        partyPresetFolderId: 10,
      },
    })

    expect(result).toEqual(nodes)
  })

  it('keeps full tree when restriction is disabled', () => {
    const nodes = makeNodes()
    const result = scopePresetTreeForRoom(nodes, {
      isPrivileged: false,
      roomPrefs: {
        restrictCollaboratorsToPartyPresetFolder: false,
        partyPresetFolderId: 10,
      },
    })

    expect(result).toEqual(nodes)
  })

  it('scopes collaborators to the configured party folder', () => {
    const nodes = makeNodes()
    const result = scopePresetTreeForRoom(nodes, {
      isPrivileged: false,
      roomPrefs: {
        restrictCollaboratorsToPartyPresetFolder: true,
        partyPresetFolderId: 10,
      },
    })

    expect(result.map(node => node.name)).toEqual(['Party Gold'])
  })

  it('returns empty tree when configured folder is missing', () => {
    const nodes = makeNodes()
    const result = scopePresetTreeForRoom(nodes, {
      isPrivileged: false,
      roomPrefs: {
        restrictCollaboratorsToPartyPresetFolder: true,
        partyPresetFolderId: 999,
      },
    })

    expect(result).toEqual([])
  })
})
