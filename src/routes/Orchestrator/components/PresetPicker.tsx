import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { HYDRA_GALLERY } from './hydraGallery'
import { decodeSketch } from './hydraPresets'
import { buildPickerOptions, filterPickerOptions } from './presetPicker'
import styles from './PresetPicker.css'

interface PresetPickerProps {
  onLoad?: (code: string) => void
  onSend?: (code: string) => void
  onRandomize?: () => void
}

function PresetPicker ({ onLoad, onSend, onRandomize }: PresetPickerProps) {
  const options = useMemo(() => buildPickerOptions(HYDRA_GALLERY), [])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement | null>(null)

  const filtered = useMemo(() => filterPickerOptions(options, query), [options, query])

  const handleLoadByIndex = useCallback((index: number) => {
    const code = decodeSketch(HYDRA_GALLERY[index])
    onLoad?.(code)
    setOpen(false)
  }, [onLoad])

  const handleSendByIndex = useCallback((index: number) => {
    const code = decodeSketch(HYDRA_GALLERY[index])
    onSend?.(code)
    setOpen(false)
  }, [onSend])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className={styles.picker} ref={panelRef}>
      <button
        type='button'
        className={styles.toggle}
        onClick={() => setOpen(o => !o)}
      >
        Presets
      </button>
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <input
              className={styles.search}
              type='text'
              placeholder='Search...'
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {onRandomize && (
              <button
                type='button'
                className={styles.random}
                onClick={() => {
                  onRandomize()
                  setOpen(false)
                }}
              >
                Random
              </button>
            )}
          </div>
          <div className={styles.list}>
            {filtered.length === 0 && <div className={styles.empty}>No matches</div>}
            {filtered.map(option => (
              <div key={option.index} className={styles.row}>
                <span className={styles.label}>{option.label}</span>
                <div className={styles.actions}>
                  <button
                    type='button'
                    className={styles.action}
                    onClick={() => handleLoadByIndex(option.index)}
                  >
                    Load
                  </button>
                  <button
                    type='button'
                    className={`${styles.action} ${styles.actionPrimary}`}
                    onClick={() => handleSendByIndex(option.index)}
                  >
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PresetPicker
