import React from 'react'
import type { PresetLeaf, PresetTreeNode } from './presetTree'
import styles from './PresetTree.css'

interface PresetTreeProps {
  nodes: PresetTreeNode[]
  expanded: Set<string>
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
  onToggleFolder,
  onLoad,
  onSend,
  onClone,
  onDeletePreset,
  onDeleteFolder,
  canDeletePreset,
  canDeleteFolder,
}: PresetTreeProps) {
  return (
    <div className={styles.tree}>
      {nodes.map((node) => {
        const isOpen = expanded.has(node.id)
        return (
          <div key={node.id} className={styles.folder}>
            <div
              className={styles.folderHeader}
              role='button'
              tabIndex={0}
              onClick={() => onToggleFolder(node.id)}
              onKeyDown={e => e.key === 'Enter' && onToggleFolder(node.id)}
            >
              <span className={styles.disclosure}>{isOpen ? '▾' : '▸'}</span>
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

            {isOpen && (
              <div className={styles.children}>
                {node.children.length === 0 && (
                  <div className={styles.empty}>No presets</div>
                )}
                {node.children.map(preset => (
                  <div key={preset.id} className={styles.presetRow}>
                    <span className={styles.presetName}>{preset.name}</span>
                    {preset.usesCamera && <span className={`${styles.badge} ${styles.badgeCam}`}>Cam</span>}
                    <div className={styles.actions}>
                      <button
                        type='button'
                        className={styles.actionButton}
                        onClick={() => onLoad(preset)}
                      >
                        Load
                      </button>
                      <button
                        type='button'
                        className={`${styles.actionButton} ${styles.actionPrimary}`}
                        onClick={() => onSend(preset)}
                      >
                        Send
                      </button>
                      {preset.isGallery && onClone && (
                        <button
                          type='button'
                          className={styles.actionButton}
                          onClick={() => onClone(preset)}
                        >
                          Clone
                        </button>
                      )}
                      {!preset.isGallery && onDeletePreset && (canDeletePreset?.(preset) ?? true) && (
                        <button
                          type='button'
                          className={`${styles.actionButton} ${styles.actionDanger}`}
                          onClick={() => onDeletePreset(preset)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PresetTree
