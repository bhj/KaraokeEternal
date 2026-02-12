import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'store/hooks'
import { fetchAllPresets, fetchFolders } from 'routes/Orchestrator/api/hydraPresetsApi'
import type { PresetFolder, PresetItem } from 'routes/Orchestrator/components/presetTree'
import { buildRuntimePresetPool, resolvePlayerPresetFolderId } from './runtimePresets'

export function useRuntimeHydraPresets () {
  const roomId = useAppSelector(state => state.user.roomId)
  const roomPrefs = useAppSelector((state) => {
    if (typeof state.user.roomId !== 'number') return undefined
    return state.rooms.entities[state.user.roomId]?.prefs
  })
  const configuredFolderId = resolvePlayerPresetFolderId(roomPrefs)

  const [folders, setFolders] = useState<PresetFolder[]>([])
  const [presets, setPresets] = useState<PresetItem[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [folderList, presetList] = await Promise.all([
          fetchFolders(),
          fetchAllPresets(),
        ])

        if (cancelled) return
        setFolders(folderList)
        setPresets(presetList)
      } catch {
        if (cancelled) return
        setFolders([])
        setPresets([])
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [roomId, configuredFolderId])

  return useMemo(() => buildRuntimePresetPool({ roomPrefs, folders, presets }), [roomPrefs, folders, presets])
}
