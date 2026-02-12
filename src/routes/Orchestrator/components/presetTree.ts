import { decodeSketch } from './hydraPresets'
import type { HydraGalleryItem } from './hydraGallery'
import { detectCameraUsage } from 'lib/detectCameraUsage'

export interface PresetFolder {
  folderId: number
  name: string
  authorUserId: number
  authorName: string
  sortOrder: number
  isGallery?: boolean
}

export interface PresetItem {
  presetId: number
  folderId: number
  name: string
  code: string
  authorUserId: number
  authorName: string
  sortOrder: number
}

export interface PresetLeaf {
  id: string
  presetId?: number
  folderId?: number
  name: string
  code: string
  isGallery: boolean
  usesCamera: boolean
  authorUserId?: number
  authorName?: string
}

export interface PresetTreeNode {
  id: string
  folderId?: number
  name: string
  isGallery: boolean
  children: PresetLeaf[]
  authorUserId?: number
  authorName?: string
  sortOrder?: number
}

export function buildPresetTree (
  folders: PresetFolder[],
  presets: PresetItem[],
  gallery: HydraGalleryItem[],
): PresetTreeNode[] {
  const galleryNode: PresetTreeNode = {
    id: 'gallery',
    name: 'Gallery',
    isGallery: true,
    children: gallery.map((item) => {
      const code = decodeSketch(item)
      return {
        id: `gallery:${item.sketch_id}`,
        name: item.sketch_id,
        code,
        isGallery: true,
        usesCamera: detectCameraUsage(code).sources.length > 0,
      }
    }),
  }

  const folderNodes: PresetTreeNode[] = folders
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(folder => ({
      id: `folder:${folder.folderId}`,
      folderId: folder.folderId,
      name: folder.name,
      isGallery: false,
      children: [] as PresetLeaf[],
      authorUserId: folder.authorUserId,
      authorName: folder.authorName,
      sortOrder: folder.sortOrder,
    }))

  const folderMap = new Map<number, PresetTreeNode>()
  for (const folder of folderNodes) {
    if (typeof folder.folderId === 'number') {
      folderMap.set(folder.folderId, folder)
    }
  }

  for (const preset of presets) {
    const parent = folderMap.get(preset.folderId)
    if (!parent) continue
    parent.children.push({
      id: `preset:${preset.presetId}`,
      presetId: preset.presetId,
      folderId: preset.folderId,
      name: preset.name,
      code: preset.code,
      isGallery: false,
      usesCamera: detectCameraUsage(preset.code).sources.length > 0,
      authorUserId: preset.authorUserId,
      authorName: preset.authorName,
    })
  }

  return [galleryNode, ...folderNodes]
}
