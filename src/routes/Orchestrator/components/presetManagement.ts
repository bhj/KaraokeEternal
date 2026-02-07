import type { IRoomPrefs } from 'shared/types'
import type { PresetFolder } from './presetTree'

export type MoveDirection = 'up' | 'down'

export function getDefaultSaveFolderId (
  folders: PresetFolder[],
  roomPrefs?: Partial<IRoomPrefs> | null,
): number | '' {
  if (folders.length === 0) return ''

  const scopedFolderId = roomPrefs?.partyPresetFolderId
  if (typeof scopedFolderId === 'number' && folders.some(folder => folder.folderId === scopedFolderId)) {
    return scopedFolderId
  }

  return folders[0].folderId
}

export function reorderByDirection (ids: number[], id: number, direction: MoveDirection): number[] | null {
  const currentIndex = ids.indexOf(id)
  if (currentIndex < 0) return null

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= ids.length) return null

  const next = ids.slice()
  const [item] = next.splice(currentIndex, 1)
  next.splice(targetIndex, 0, item)
  return next
}

export function toSortOrderUpdates (ids: number[]): Array<{ id: number, sortOrder: number }> {
  return ids.map((id, index) => ({ id, sortOrder: index }))
}
