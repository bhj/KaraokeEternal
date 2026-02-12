import type { IRoomPrefs } from 'shared/types'
import type { PresetFolder, PresetItem } from 'routes/Orchestrator/components/presetTree'
import { PRESETS, PRESET_LABELS } from 'routes/Orchestrator/components/hydraPresets'

export type RuntimePresetSource = 'gallery' | 'folder'

export interface RuntimeHydraPreset {
  code: string
  name: string
  presetId: number | null
  folderId: number | null
  source: RuntimePresetSource
}

export interface RuntimeHydraPresetPool {
  source: RuntimePresetSource
  folderId: number | null
  folderName: string | null
  presets: RuntimeHydraPreset[]
}

function asPositiveInt (value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null
}

export function resolvePlayerPresetFolderId (roomPrefs?: Partial<IRoomPrefs> | null): number | null {
  const explicitPlayerFolder = asPositiveInt(roomPrefs?.playerPresetFolderId)
  if (explicitPlayerFolder !== null) return explicitPlayerFolder
  return asPositiveInt(roomPrefs?.partyPresetFolderId)
}

function getGalleryPool (): RuntimeHydraPresetPool {
  return {
    source: 'gallery',
    folderId: null,
    folderName: null,
    presets: PRESETS.map<RuntimeHydraPreset>((code, i) => ({
      code,
      name: PRESET_LABELS[i],
      presetId: null,
      folderId: null,
      source: 'gallery',
    })),
  }
}

export function buildRuntimePresetPool ({
  roomPrefs,
  folders,
  presets,
}: {
  roomPrefs?: Partial<IRoomPrefs> | null
  folders: PresetFolder[]
  presets: PresetItem[]
}): RuntimeHydraPresetPool {
  const folderId = resolvePlayerPresetFolderId(roomPrefs)
  if (folderId === null) {
    return getGalleryPool()
  }

  const folderPresets = presets
    .filter(preset => preset.folderId === folderId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.presetId - b.presetId)

  if (folderPresets.length === 0) {
    return getGalleryPool()
  }

  const folderName = folders.find(folder => folder.folderId === folderId)?.name ?? 'Preset Folder'

  return {
    source: 'folder',
    folderId,
    folderName,
    presets: folderPresets.map(preset => ({
      code: preset.code,
      name: preset.name,
      presetId: preset.presetId,
      folderId: preset.folderId,
      source: 'folder',
    })),
  }
}

export function normalizePresetIndex (index: number | undefined, count: number): number {
  if (count <= 0) return 0
  if (typeof index !== 'number' || !Number.isInteger(index)) return 0
  if (index < 0) return 0
  if (index >= count) return 0
  return index
}

export function getNextPresetIndex (index: number, count: number): number {
  if (count <= 0) return 0
  return (index + 1) % count
}

export function getPrevPresetIndex (index: number, count: number): number {
  if (count <= 0) return 0
  return (index - 1 + count) % count
}

export function getRandomPresetIndex (index: number, count: number): number {
  if (count <= 1) return 0
  const next = Math.floor(Math.random() * (count - 1))
  return next >= index ? next + 1 : next
}

export function toVisualizerPresetLabel (preset: RuntimeHydraPreset, folderName?: string | null): string {
  if (preset.source === 'gallery') return preset.name
  if (folderName && folderName.trim()) return `${folderName} / ${preset.name}`
  return preset.name
}
