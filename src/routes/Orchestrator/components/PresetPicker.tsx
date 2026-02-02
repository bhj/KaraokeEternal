import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildPickerOptions, filterPickerOptions } from './presetPicker'
import styles from './PresetPicker.css'

const allOptions = buildPickerOptions()

interface PresetPickerProps {
  onLoad: (code: string) => void
  onSend: (code: string) => void
}

function PresetPicker ({ onLoad, onSend }: PresetPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => filterPickerOptions(allOptions, query),
    [query],
  )

  const handleToggle = useCallback(() => {
    setOpen(prev => !prev)
    setQuery('')
  }, [])

  const handleLoad = useCallback((code: string) => {
    onLoad(code)
    setOpen(false)
    setQuery('')
  }, [onLoad])

  const handleSend = useCallback((e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    onSend(code)
    setOpen(false)
    setQuery('')
  }, [onSend])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Focus search input when opening
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <div className={styles.picker} ref={containerRef}>
      <button
        type='button'
        className={`${styles.pickerToggle} ${open ? styles.pickerToggleActive : ''}`}
        onClick={handleToggle}
      >
        Presets
      </button>
      {open && (
        <div className={styles.dropdown}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type='text'
            placeholder='Search...'
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className={styles.optionList}>
            {filtered.length === 0 && (
              <div className={styles.empty}>No presets match</div>
            )}
            {filtered.map(opt => (
              <button
                key={opt.index}
                type='button'
                className={styles.option}
                onClick={() => handleLoad(opt.code)}
              >
                <span className={styles.optionLabel}>{opt.label}</span>
                <span
                  className={styles.optionSend}
                  onClick={(e) => handleSend(e, opt.code)}
                  role='button'
                  tabIndex={0}
                >
                  Send
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PresetPicker
