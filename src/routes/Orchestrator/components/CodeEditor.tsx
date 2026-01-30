import React, { useCallback, useRef } from 'react'
import styles from './CodeEditor.css'

interface CodeEditorProps {
  code: string
  onCodeChange: (code: string) => void
  onSend: (code: string) => void
  onRandomize: () => void
}

function CodeEditor ({ code, onCodeChange, onSend, onRandomize }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    onSend(code)
  }, [code, onSend])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(event.target.value)
  }, [onCodeChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      onCodeChange(newCode)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }, [handleSend, code, onCodeChange])

  return (
    <div className={styles.container}>
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
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
        <button type='button' className={styles.randomButton} onClick={onRandomize}>
          Random
        </button>
        <button type='button' className={styles.sendButton} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  )
}

export default CodeEditor
