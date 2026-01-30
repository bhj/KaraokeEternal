import React, { useState, useCallback, useRef } from 'react'
import styles from './CodeEditor.css'

const DEFAULT_CODE = `osc(20, 0.1, () => bass() * 2)
  .color(1, 0.5, () => treble())
  .modulate(noise(3), () => beat() * 0.4)
  .modulate(voronoi(5, () => energy() * 2), () => beat() * 0.2)
  .rotate(() => mid() * 0.5)
  .kaleid(() => 2 + beat() * 4)
  .saturate(() => 0.6 + energy() * 0.4)
  .out()`

interface CodeEditorProps {
  onSend: (code: string) => void
  generatedCode?: string
}

function CodeEditor ({ onSend, generatedCode }: CodeEditorProps) {
  const [manualCode, setManualCode] = useState(generatedCode ?? DEFAULT_CODE)
  const [isManualMode, setIsManualMode] = useState(!generatedCode)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const displayCode = isManualMode ? manualCode : (generatedCode ?? DEFAULT_CODE)

  const handleSend = useCallback(() => {
    onSend(displayCode)
  }, [displayCode, onSend])

  const handleToggleManual = useCallback(() => {
    setIsManualMode((prev) => {
      const next = !prev
      if (next && !prev) {
        setManualCode(generatedCode ?? DEFAULT_CODE)
      }
      return next
    })
  }, [generatedCode])

  const handleEditorChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualCode(event.target.value)
    if (!isManualMode) {
      setIsManualMode(true)
    }
  }, [isManualMode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
    // Tab inserts 2 spaces
    if (e.key === 'Tab' && isManualMode) {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newCode = manualCode.substring(0, start) + '  ' + manualCode.substring(end)
      setManualCode(newCode)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }, [handleSend, isManualMode, manualCode])

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className={styles.toggle}>{isCollapsed ? '\u25B6' : '\u25BC'}</span>
        <span className={styles.title}>Hydra Code</span>
        <div className={styles.headerActions} onClick={event => event.stopPropagation()}>
          <label className={styles.modeToggle}>
            <input
              type='checkbox'
              checked={isManualMode}
              onChange={handleToggleManual}
            />
            Manual
          </label>
        </div>
      </div>
      {!isCollapsed && (
        <div className={styles.body}>
          <textarea
            ref={textareaRef}
            className={styles.editor}
            value={displayCode}
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            readOnly={!isManualMode}
          />
          <div className={styles.footer}>
            <span className={styles.hint}>Ctrl+Enter to send</span>
            <div className={styles.audioVars}>
              <span>bass()</span>
              <span>mid()</span>
              <span>treble()</span>
              <span>beat()</span>
              <span>energy()</span>
              <span>bpm()</span>
              <span>bright()</span>
            </div>
            <button className={styles.sendButton} onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor
