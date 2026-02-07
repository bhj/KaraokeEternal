import { describe, expect, it } from 'vitest'
import { buildRuntimePresetPool, resolvePlayerPresetFolderId } from './runtimePresets'
import type { IRoomPrefs } from 'shared/types'
import type { PresetFolder, PresetItem } from 'routes/Orchestrator/components/presetTree'

describe('runtimePresets', () => {
  const folders: PresetFolder[] = [
    { folderId: 1, name: 'Working Standards', authorUserId: 10, authorName: 'owner', sortOrder: 1 },
    { folderId: 2, name: 'Alt', authorUserId: 10, authorName: 'owner', sortOrder: 2 },
  ]

  const presets: PresetItem[] = [
    { presetId: 11, folderId: 1, name: 'ws_b', code: 'noise(2).out()', authorUserId: 10, authorName: 'owner', sortOrder: 2 },
    { presetId: 10, folderId: 1, name: 'ws_a', code: 'osc(10).out()', authorUserId: 10, authorName: 'owner', sortOrder: 1 },
    { presetId: 20, folderId: 2, name: 'alt_a', code: 'shape(4).out()', authorUserId: 10, authorName: 'owner', sortOrder: 1 },
  ]

  it('uses playerPresetFolderId when configured', () => {
    const prefs: Partial<IRoomPrefs> = { playerPresetFolderId: 1 }
    const pool = buildRuntimePresetPool({ roomPrefs: prefs, folders, presets })

    expect(pool.source).toBe('folder')
    expect(pool.folderId).toBe(1)
    expect(pool.folderName).toBe('Working Standards')
    expect(pool.presets.map(p => p.name)).toEqual(['ws_a', 'ws_b'])
  })

  it('falls back to partyPresetFolderId for backward compatibility', () => {
    const prefs: Partial<IRoomPrefs> = { partyPresetFolderId: 2 }
    const pool = buildRuntimePresetPool({ roomPrefs: prefs, folders, presets })

    expect(pool.source).toBe('folder')
    expect(pool.folderId).toBe(2)
    expect(pool.presets).toHaveLength(1)
    expect(pool.presets[0].name).toBe('alt_a')
  })

  it('falls back to gallery when configured folder has no presets', () => {
    const prefs: Partial<IRoomPrefs> = { playerPresetFolderId: 999 }
    const pool = buildRuntimePresetPool({ roomPrefs: prefs, folders, presets })

    expect(pool.source).toBe('gallery')
    expect(pool.folderId).toBeNull()
    expect(pool.presets.length).toBeGreaterThan(0)
  })

  it('resolvePlayerPresetFolderId prefers playerPresetFolderId over partyPresetFolderId', () => {
    const folderId = resolvePlayerPresetFolderId({
      playerPresetFolderId: 2,
      partyPresetFolderId: 1,
    })

    expect(folderId).toBe(2)
  })
})
