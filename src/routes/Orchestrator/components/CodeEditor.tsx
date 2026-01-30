import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAppSelector } from 'store/hooks'
import { findNumberAtCursor, spliceNumber, getScrubberRange } from './scrubberUtils'
import styles from './CodeEditor.css'

interface ScrubberState {
  charStart: number
  charEnd: number
  value: number
  min: number
  max: number
  step: number
  left: number
  top: number
}

interface CodeEditorProps {
  code: string
  onCodeChange: (code: string) => void
  onSend: (code: string) => void
  onRandomize: () => void
}

function CodeEditor ({ code, onCodeChange, onSend, onRandomize }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrubber, setScrubber] = useState<ScrubberState | null>(null)
  const innerWidth = useAppSelector(state => state.ui.innerWidth)
  const isDesktop = innerWidth >= 980

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
      return
    }
    if (e.key === 'Escape' && scrubber) {
      setScrubber(null)
    }
  }, [handleSend, code, onCodeChange, scrubber])

  const positionScrubber = useCallback((charStart: number): { left: number, top: number } | null => {
    const textarea = textareaRef.current
    const mirror = mirrorRef.current
    const container = containerRef.current
    if (!textarea || !mirror || !container) return null

    // Copy computed styles from textarea to mirror
    const computed = window.getComputedStyle(textarea)
    const stylesToCopy = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'width', 'wordWrap', 'whiteSpace', 'letterSpacing', 'border',
      'boxSizing', 'tabSize',
    ] as const

    for (const prop of stylesToCopy) {
      ;(mirror.style as Record<string, string>)[prop] = computed.getPropertyValue(
        prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`),
      )
    }
    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.overflow = 'hidden'
    mirror.style.height = 'auto'

    // Insert content up to cursor, with a span at the position
    const beforeText = code.substring(0, charStart)
    const textNode = document.createTextNode(beforeText)
    const marker = document.createElement('span')
    marker.textContent = '\u200B' // zero-width space

    mirror.innerHTML = ''
    mirror.appendChild(textNode)
    mirror.appendChild(marker)

    // Sync scroll position
    mirror.scrollTop = textarea.scrollTop
    mirror.scrollLeft = textarea.scrollLeft

    const markerRect = marker.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const textareaRect = textarea.getBoundingClientRect()

    return {
      left: markerRect.left - containerRect.left,
      top: textareaRect.top - containerRect.top + (markerRect.top - textareaRect.top) + parseFloat(computed.lineHeight || '20'),
    }
  }, [code])

  const handleClick = useCallback(() => {
    if (!isDesktop) return
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    if (textarea.selectionStart !== textarea.selectionEnd) return // text selected, skip

    const match = findNumberAtCursor(code, cursorPos)
    if (!match) {
      setScrubber(null)
      return
    }

    const range = getScrubberRange(match.value)
    const pos = positionScrubber(match.charStart)
    if (!pos) return

    setScrubber({
      charStart: match.charStart,
      charEnd: match.charEnd,
      value: match.value,
      min: range.min,
      max: range.max,
      step: range.step,
      left: pos.left,
      top: pos.top,
    })
  }, [code, isDesktop, positionScrubber])

  const handleScrubberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!scrubber) return
    const newValue = parseFloat(e.target.value)
    const newValueStr = scrubber.step < 1
      ? newValue.toFixed(Math.max(0, -Math.floor(Math.log10(scrubber.step))))
      : String(newValue)

    const newCode = spliceNumber(code, scrubber.charStart, scrubber.charEnd, newValueStr)
    const newEnd = scrubber.charStart + newValueStr.length

    onCodeChange(newCode)
    setScrubber(prev => prev
      ? { ...prev, value: newValue, charEnd: newEnd }
      : null,
    )
  }, [scrubber, code, onCodeChange])

  // Close scrubber on click outside
  useEffect(() => {
    if (!scrubber) return
    const handleOutsideClick = (e: MouseEvent) => {
      const container = containerRef.current
      if (container && !container.contains(e.target as Node)) {
        setScrubber(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [scrubber])

  return (
    <div className={styles.container} ref={containerRef}>
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={code}
        onChange={handleChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
      <div ref={mirrorRef} className={styles.mirror} aria-hidden='true' />
      {scrubber && (
        <div
          className={styles.scrubberOverlay}
          style={{ left: scrubber.left, top: scrubber.top }}
        >
          <input
            type='range'
            min={scrubber.min}
            max={scrubber.max}
            step={scrubber.step}
            value={scrubber.value}
            onChange={handleScrubberChange}
          />
          <span className={styles.scrubberValue}>{scrubber.value}</span>
        </div>
      )}
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
