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

type PendingDelete = { type: 'preset', preset: PresetLeaf } | { type: 'folder', folder: PresetTreeNode } | null

function toErrorMessage (err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function PresetBrowser ({ currentCode, onLoad, onSend }: PresetBrowserProps) {
  const user = useAppSelector(state => state.user)
  const [folders, setFolders] = useState<PresetFolder[]>([])
  const [presets, setPresets] = useState<PresetItem[]>([])
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['gallery']))
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetFolderId, setPresetFolderId] = useState<number | ''>('')
  const [draftCode, setDraftCode] = useState('')

  const [savingFolder, setSavingFolder] = useState(false)
  const [savingPreset, setSavingPreset] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [deleting, setDeleting] = useState(false)

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
      setError(toErrorMessage(err, 'Failed to load presets'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (selectedPresetId === null) return
    if (!presets.some(preset => preset.presetId === selectedPresetId)) {
      setSelectedPresetId(null)
    }
  }, [presets, selectedPresetId])

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

  const toggleFolder = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleLoad = useCallback((preset: PresetLeaf) => {
    setSelectedPresetId(preset.presetId ?? null)
    onLoad(preset.code)
  }, [onLoad])

  const handleSend = useCallback((preset: PresetLeaf) => {
    setSelectedPresetId(preset.presetId ?? null)
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

  const requestDeletePreset = useCallback((preset: PresetLeaf) => {
    if (!preset.presetId) return
    setPendingDelete({ type: 'preset', preset })
  }, [])

  const requestDeleteFolder = useCallback((node: PresetTreeNode) => {
    if (!node.folderId) return
    setPendingDelete({ type: 'folder', folder: node })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting) return

    try {
      setDeleting(true)
      setError(null)

      if (pendingDelete.type === 'preset') {
        if (!pendingDelete.preset.presetId) return
        await deletePreset(pendingDelete.preset.presetId)
      } else {
        if (!pendingDelete.folder.folderId) return
        await deleteFolder(pendingDelete.folder.folderId)
      }

      setPendingDelete(null)
      await refresh()
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to delete item'))
    } finally {
      setDeleting(false)
    }
  }, [pendingDelete, deleting, refresh])

  const openSavePreset = useCallback((preset?: PresetLeaf) => {
    const draft = buildPresetDraft({ currentCode, preset })

    if (preset?.folderId && folders.some(folder => folder.folderId === preset.folderId)) {
      setPresetFolderId(preset.folderId)
    } else if (folders.length > 0) {
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
    if (!name || savingFolder) return

    try {
      setSavingFolder(true)
      setError(null)
      const created = await createFolder(name)
      setExpanded(prev => new Set(prev).add(`folder:${created.folderId}`))
      setShowNewFolder(false)
      setNewFolderName('')
      await refresh()
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to create folder'))
    } finally {
      setSavingFolder(false)
    }
  }, [newFolderName, refresh, savingFolder])

  const handleSavePreset = useCallback(async () => {
    const name = presetName.trim()
    if (!name || !presetFolderId || savingPreset) return

    try {
      setSavingPreset(true)
      setError(null)

      const created = await createPreset({
        folderId: presetFolderId,
        name,
        code: draftCode,
      })

      setExpanded(prev => new Set(prev).add(`folder:${presetFolderId}`))
      setSelectedPresetId(created.presetId)
      setShowSavePreset(false)
      setPresetName('')
      setDraftCode('')
      await refresh()
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to save preset'))
    } finally {
      setSavingPreset(false)
    }
  }, [presetName, presetFolderId, draftCode, refresh, savingPreset])

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
        <label className={styles.modalLabel}>
          Code preview
          <textarea
            className={styles.modalCodePreview}
            value={draftCode}
            readOnly
            rows={10}
            spellCheck={false}
          />
        </label>
      </>
    )
  }

  const deleteModalTitle = pendingDelete?.type === 'folder' ? 'Delete Folder' : 'Delete Preset'
  const deleteModalText = pendingDelete?.type === 'folder'
    ? `Delete folder "${pendingDelete.folder.name}" and all presets inside?`
    : pendingDelete?.type === 'preset'
      ? `Delete preset "${pendingDelete.preset.name}"?`
      : ''

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

      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          type='text'
          placeholder='Search presets...'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query.length > 0 && (
          <button
            type='button'
            className={styles.searchClear}
            onClick={() => setQuery('')}
            aria-label='Clear preset search'
          >
            Clear
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.loading} role='status' aria-live='polite'>
          <div className={styles.loadingLabel}>Loading presets...</div>
          <div className={styles.skeletonList}>
            {[0, 1, 2].map(group => (
              <div key={group} className={styles.skeletonGroup}>
                <div className={styles.skeletonFolder} />
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonItemShort} />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <PresetTree
          nodes={filteredTree}
          expanded={expanded}
          selectedPresetId={selectedPresetId}
          onToggleFolder={toggleFolder}
          onLoad={handleLoad}
          onSend={handleSend}
          onClone={handleClonePreset}
          onDeletePreset={requestDeletePreset}
          onDeleteFolder={requestDeleteFolder}
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
            <Button variant='default' onClick={() => setShowNewFolder(false)} disabled={savingFolder}>Cancel</Button>
            <Button variant='primary' onClick={handleCreateFolder} disabled={savingFolder || !newFolderName.trim()}>
              {savingFolder ? 'Creating...' : 'Create'}
            </Button>
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
            <Button variant='default' onClick={() => setShowSavePreset(false)} disabled={savingPreset}>Cancel</Button>
            <Button
              variant='primary'
              onClick={handleSavePreset}
              disabled={savingPreset || folders.length === 0 || !presetName.trim() || !presetFolderId}
            >
              {savingPreset ? 'Saving...' : 'Save'}
            </Button>
          </>
        )}
      >
        {savePresetBody}
      </Modal>

      <Modal
        title={deleteModalTitle}
        visible={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        buttons={(
          <>
            <Button variant='default' onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant='danger' onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        )}
      >
        <div className={styles.confirmText}>{deleteModalText}</div>
      </Modal>
    </div>
  )
}

export default PresetBrowser
