import React, { useCallback } from 'react'
import clsx from 'clsx'
import type { PresetLeaf, PresetTreeNode } from './presetTree'
import styles from './PresetTree.css'

interface PresetTreeProps {
  nodes: PresetTreeNode[]
  expanded: Set<string>
  selectedPresetId?: number | null
  onToggleFolder: (id: string) => void
  onLoad: (preset: PresetLeaf) => void
  onSend: (preset: PresetLeaf) => void
  onClone?: (preset: PresetLeaf) => void
  onDeletePreset?: (preset: PresetLeaf) => void
  onDeleteFolder?: (node: PresetTreeNode) => void
  canDeletePreset?: (preset: PresetLeaf) => boolean
  canDeleteFolder?: (node: PresetTreeNode) => boolean
}

function PresetTree ({
  nodes,
  expanded,
  selectedPresetId,
  onToggleFolder,
  onLoad,
  onSend,
  onClone,
  onDeletePreset,
  onDeleteFolder,
  canDeletePreset,
  canDeleteFolder,
}: PresetTreeProps) {
  const focusByOffset = useCallback((target: HTMLElement, offset: number) => {
    const treeRoot = target.closest('[data-tree-root="true"]') as HTMLElement | null
    if (!treeRoot) return

    const focusables = Array.from(treeRoot.querySelectorAll<HTMLElement>('[data-tree-focusable="true"]'))
    const idx = focusables.indexOf(target)
    if (idx === -1) return

    const next = focusables[idx + offset]
    if (next) next.focus()
  }, [])

  const handleFolderKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, node: PresetTreeNode, isOpen: boolean) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleFolder(node.id)
      return
    }

    if (event.key === 'ArrowRight' && !isOpen && node.children.length > 0) {
      event.preventDefault()
      onToggleFolder(node.id)
      return
    }

    if (event.key === 'ArrowLeft' && isOpen) {
      event.preventDefault()
      onToggleFolder(node.id)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusByOffset(event.currentTarget, 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusByOffset(event.currentTarget, -1)
    }
  }, [focusByOffset, onToggleFolder])

  const handlePresetKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, preset: PresetLeaf) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onLoad(preset)
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      onSend(preset)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusByOffset(event.currentTarget, 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusByOffset(event.currentTarget, -1)
    }
  }, [focusByOffset, onLoad, onSend])

  return (
    <div className={styles.tree} data-tree-root='true'>
      {nodes.map((node) => {
        const isOpen = expanded.has(node.id)
        return (
          <div key={node.id} className={styles.folder}>
            <div
              className={styles.folderHeader}
              role='button'
              tabIndex={0}
              data-tree-focusable='true'
              onClick={() => onToggleFolder(node.id)}
              onKeyDown={e => handleFolderKeyDown(e, node, isOpen)}
            >
              <span
                className={clsx(styles.disclosure, isOpen && styles.disclosureOpen)}
                aria-hidden
              >
                ▸
              </span>
              <span className={styles.folderName}>{node.name}</span>
              {node.isGallery && <span className={styles.badge}>Gallery</span>}
              {!node.isGallery && onDeleteFolder && (canDeleteFolder?.(node) ?? true) && (
                <button
                  type='button'
                  className={styles.folderDelete}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteFolder(node)
                  }}
                >
                  Delete
                </button>
              )}
            </div>

            <div className={clsx(styles.childrenWrap, isOpen && styles.childrenWrapOpen)}>
              <div className={styles.children}>
                {node.children.length === 0 && (
                  <div className={styles.empty}>No presets</div>
                )}
                {node.children.map((preset) => {
                  const isSelected = typeof preset.presetId === 'number' && preset.presetId === selectedPresetId
                  return (
                    <div
                      key={preset.id}
                      className={clsx(styles.presetRow, isSelected && styles.presetRowSelected)}
                      role='button'
                      tabIndex={0}
                      data-tree-focusable='true'
                      onClick={() => onLoad(preset)}
                      onKeyDown={e => handlePresetKeyDown(e, preset)}
                    >
                      <span className={styles.presetName}>{preset.name}</span>
                      {preset.usesCamera && <span className={clsx(styles.badge, styles.badgeCam)}>Cam</span>}
                      <div className={styles.actions}>
                        <button
                          type='button'
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            onLoad(preset)
                          }}
                        >
                          Load
                        </button>
                        <button
                          type='button'
                          className={clsx(styles.actionButton, styles.actionPrimary)}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSend(preset)
                          }}
                        >
                          Send
                        </button>
                        {preset.isGallery && onClone && (
                          <button
                            type='button'
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation()
                              onClone(preset)
                            }}
                          >
                            Save as...
                          </button>
                        )}
                        {!preset.isGallery && onDeletePreset && (canDeletePreset?.(preset) ?? true) && (
                          <button
                            type='button'
                            className={clsx(styles.actionButton, styles.actionDanger)}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeletePreset(preset)
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PresetTree
