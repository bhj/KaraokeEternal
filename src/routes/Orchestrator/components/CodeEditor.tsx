import React, { useState, useCallback, useRef, useEffect } from 'react'
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
  const [code, setCode] = useState(generatedCode ?? DEFAULT_CODE)
  const [isManualMode, setIsManualMode] = useState(!generatedCode)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync generated code from patch bay when not in manual mode
  useEffect(() => {
    if (!isManualMode && generatedCode) {
      setCode(generatedCode)
    }
  }, [generatedCode, isManualMode])

  const handleSend = useCallback(() => {
    onSend(code)
  }, [onSend, code])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
    // Tab inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }, [handleSend, code])

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className={styles.toggle}>{isCollapsed ? '\u25B6' : '\u25BC'}</span>
        <span className={styles.title}>Hydra Code</span>
        <div className={styles.headerActions} onClick={e => e.stopPropagation()}>
          <label className={styles.modeToggle}>
            <input
              type='checkbox'
              checked={isManualMode}
              onChange={() => setIsManualMode(!isManualMode)}
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
            value={code}
            onChange={e => { setCode(e.target.value); setIsManualMode(true) }}
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
