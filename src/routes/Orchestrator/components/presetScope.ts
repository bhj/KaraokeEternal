import type { IRoomPrefs } from 'shared/types'
import type { PresetTreeNode } from './presetTree'

interface PresetScopeOptions {
  isPrivileged: boolean
  roomPrefs?: Partial<IRoomPrefs> | null
}

export function scopePresetTreeForRoom (nodes: PresetTreeNode[], { isPrivileged, roomPrefs }: PresetScopeOptions): PresetTreeNode[] {
  if (isPrivileged) return nodes

  if (roomPrefs?.restrictCollaboratorsToPartyPresetFolder !== true) {
    return nodes
  }

  const folderId = roomPrefs.partyPresetFolderId
  if (typeof folderId !== 'number') {
    return []
  }

  return nodes.filter(node => node.isGallery === false && node.folderId === folderId)
}
