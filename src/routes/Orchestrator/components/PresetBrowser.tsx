import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Modal from 'components/Modal/Modal'
import Button from 'components/Button/Button'
import { useAppSelector } from 'store/hooks'
import { HYDRA_GALLERY } from './hydraGallery'
import PresetTree from './PresetTree'
import { buildPresetTree, type PresetLeaf, type PresetTreeNode, type PresetFolder, type PresetItem } from './presetTree'
import { buildPresetDraft } from './presetDraft'
import {
  fetchAllPresets,
  fetchFolders,
  createFolder,
  createPreset,
  deleteFolder,
  deletePreset,
} from '../api/hydraPresetsApi'
import styles from './PresetBrowser.css'

interface PresetBrowserProps {
  currentCode: string
  onLoad: (code: string) => void
  onSend: (code: string) => void
}

function PresetBrowser ({ currentCode, onLoad, onSend }: PresetBrowserProps) {
  const user = useAppSelector(state => state.user)
  const [folders, setFolders] = useState<PresetFolder[]>([])
  const [presets, setPresets] = useState<PresetItem[]>([])
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['gallery']))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetFolderId, setPresetFolderId] = useState<number | ''>('')
  const [draftCode, setDraftCode] = useState('')

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [folderList, presetList] = await Promise.all([
        fetchFolders(),
        fetchAllPresets(),
      ])
      setFolders(folderList)
      setPresets(presetList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const tree = useMemo(
    () => buildPresetTree(folders, presets, HYDRA_GALLERY),
    [folders, presets],
  )

  const filteredTree = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tree
    return tree
      .map(node => ({
        ...node,
        children: node.children.filter(child => child.name.toLowerCase().includes(q)),
      }))
      .filter(node => node.children.length > 0)
  }, [tree, query])

  let savePresetBody: React.ReactNode
  if (folders.length === 0) {
    savePresetBody = <div className={styles.empty}>Create a folder first.</div>
  } else {
    savePresetBody = (
      <>
        <label className={styles.modalLabel}>
          Preset name
          <input
            className={styles.modalInput}
            type='text'
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            autoFocus
          />
        </label>
        <label className={styles.modalLabel}>
          Folder
          <select
            className={styles.modalSelect}
            value={presetFolderId}
            onChange={e => setPresetFolderId(Number(e.target.value))}
          >
            {folders.map(folder => (
              <option key={folder.folderId} value={folder.folderId}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
      </>
    )
  }

  const toggleFolder = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleLoad = useCallback((preset: PresetLeaf) => {
    onLoad(preset.code)
  }, [onLoad])

  const handleSend = useCallback((preset: PresetLeaf) => {
    onSend(preset.code)
  }, [onSend])

  const canDeletePreset = useCallback((preset: PresetLeaf) => {
    if (preset.isGallery) return false
    if (user.isAdmin) return true
    return preset.authorUserId === user.userId
  }, [user])

  const canDeleteFolder = useCallback((node: PresetTreeNode) => {
    if (node.isGallery) return false
    if (user.isAdmin) return true
    return node.authorUserId === user.userId
  }, [user])

  const handleDeletePreset = useCallback(async (preset: PresetLeaf) => {
    if (!preset.presetId) return
    if (!window.confirm(`Delete preset "${preset.name}"?`)) return
    await deletePreset(preset.presetId)
    await refresh()
  }, [refresh])

  const handleDeleteFolder = useCallback(async (node: PresetTreeNode) => {
    if (!node.folderId) return
    if (!window.confirm(`Delete folder "${node.name}" and all presets inside?`)) return
    await deleteFolder(node.folderId)
    await refresh()
  }, [refresh])

  const openSavePreset = useCallback((preset?: PresetLeaf) => {
    const draft = buildPresetDraft({ currentCode, preset })
    if (folders.length > 0) {
      setPresetFolderId(folders[0].folderId)
    }
    setPresetName(draft.name)
    setDraftCode(draft.code)
    setShowSavePreset(true)
  }, [currentCode, folders])

  const handleClonePreset = useCallback((preset: PresetLeaf) => {
    openSavePreset(preset)
  }, [openSavePreset])

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim()
    if (!name) return
    await createFolder(name)
    setShowNewFolder(false)
    setNewFolderName('')
    await refresh()
  }, [newFolderName, refresh])

  const handleSavePreset = useCallback(async () => {
    const name = presetName.trim()
    if (!name || !presetFolderId) return
    await createPreset({
      folderId: presetFolderId,
      name,
      code: draftCode,
    })
    setShowSavePreset(false)
    setPresetName('')
    await refresh()
  }, [presetName, presetFolderId, draftCode, refresh])

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <button type='button' className={styles.toolbarButton} onClick={() => setShowNewFolder(true)}>
          New Folder
        </button>
        <button type='button' className={styles.toolbarButtonPrimary} onClick={() => openSavePreset()}>
          Save Preset
        </button>
      </div>

      <input
        className={styles.searchInput}
        type='text'
        placeholder='Search presets...'
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {loading && <div className={styles.loading}>Loading presets...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <PresetTree
          nodes={filteredTree}
          expanded={expanded}
          onToggleFolder={toggleFolder}
          onLoad={handleLoad}
          onSend={handleSend}
          onClone={handleClonePreset}
          onDeletePreset={handleDeletePreset}
          onDeleteFolder={handleDeleteFolder}
          canDeletePreset={canDeletePreset}
          canDeleteFolder={canDeleteFolder}
        />
      )}

      <Modal
        title='New Folder'
        visible={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        buttons={(
          <>
            <Button variant='default' onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button variant='primary' onClick={handleCreateFolder}>Create</Button>
          </>
        )}
      >
        <label className={styles.modalLabel}>
          Folder name
          <input
            className={styles.modalInput}
            type='text'
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            autoFocus
          />
        </label>
      </Modal>

      <Modal
        title='Save Preset'
        visible={showSavePreset}
        onClose={() => setShowSavePreset(false)}
        buttons={(
          <>
            <Button variant='default' onClick={() => setShowSavePreset(false)}>Cancel</Button>
            <Button variant='primary' onClick={handleSavePreset}>Save</Button>
          </>
        )}
      >
        {savePresetBody}
      </Modal>
    </div>
  )
}

export default PresetBrowser
