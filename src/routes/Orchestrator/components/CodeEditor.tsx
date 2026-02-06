import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorState, type Range } from '@codemirror/state'
import { Decoration, EditorView, keymap, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { linter, type Diagnostic } from '@codemirror/lint'
import { defaultKeymap, history, historyKeymap, redo, undo } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { hydraExtensions } from './hydraHighlightStyle'
import { buildHydraCompletions } from './hydraCompletions'
import { lintHydraCode } from './hydraLint'
import { formatHydraCode, getLintErrorSummary, type LintErrorSummary } from './codeEditorUtils'
import { isInjectedLine, isPartialInjectedLine } from 'lib/injectedLines'
import { detectCameraUsage } from 'lib/detectCameraUsage'
import { HYDRA_SNIPPETS } from './hydraSnippets'
import { getSkipRegions } from 'lib/skipRegions'
import styles from './CodeEditor.css'

const { topLevel, dotChain, nativeAudioDot, sourceDot } = buildHydraCompletions()

const hydraTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    height: '100%',
    fontFamily: '\'JetBrains Mono\', \'Fira Code\', \'Consolas\', monospace',
    fontSize: '13px',
  },
  '.cm-content': {
    caretColor: '#c9d1d9',
    lineHeight: '1.5',
    padding: '12px',
  },
  '.cm-gutters': {
    backgroundColor: '#0d1117',
    color: '#484f58',
    border: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(56, 139, 253, 0.3) !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#c9d1d9',
  },
  '.cm-tooltip': {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    color: '#c9d1d9',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '2px 8px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#388bfd33',
    color: '#c9d1d9',
  },
  '.cm-diagnostic-error': {
    borderLeft: '3px solid #f85149',
  },
  '.cm-injected-line': {
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderLeft: '2px solid rgba(78, 205, 196, 0.3)',
  },
})

function hydraAutocomplete (context: CompletionContext): CompletionResult | null {
  // 1. Native audio API: `a.xxx` — must come before generic dot-chain
  const audioDotMatch = context.matchBefore(/\ba\.\w*$/)
  if (audioDotMatch) {
    return {
      from: audioDotMatch.from + 2,
      options: nativeAudioDot.map(c => ({
        label: c.label,
        detail: c.detail,
        section: c.section,
        info: c.info,
      })),
    }
  }

  // 2. External source methods: `s[0-3].xxx`
  const sourceDotMatch = context.matchBefore(/\bs[0-3]\.\w*$/)
  if (sourceDotMatch) {
    return {
      from: sourceDotMatch.from + 3,
      options: sourceDot.map(c => ({
        label: c.label,
        detail: c.detail,
        section: c.section,
        info: c.info,
      })),
    }
  }

  // 3. Dot-chain: triggered after a dot
  const dotMatch = context.matchBefore(/\.\w*$/)
  if (dotMatch) {
    return {
      from: dotMatch.from,
      options: dotChain.map(c => ({
        label: c.label,
        detail: c.detail,
        section: c.section,
        info: c.info,
      })),
    }
  }

  // 4. Top-level: triggered on word chars or explicitly
  const wordMatch = context.matchBefore(/\w+$/)
  if (wordMatch || context.explicit) {
    return {
      from: wordMatch?.from ?? context.pos,
      options: topLevel.map(c => ({
        label: c.label,
        detail: c.detail,
        section: c.section,
        info: c.info,
      })),
    }
  }

  return null
}

/** Slash-command snippets: /label at line start inserts snippet code */
const snippetOptions = HYDRA_SNIPPETS.flatMap(cat =>
  cat.snippets.map(s => ({
    label: '/' + s.label,
    detail: cat.category,
    apply: s.code,
    section: cat.category,
  })),
)

function slashCommandComplete (context: CompletionContext): CompletionResult | null {
  const slashMatch = context.matchBefore(/^\s*\/\w*$/m)
  if (!slashMatch) return null

  // Guard: reject if inside comment/string
  const code = context.state.doc.toString()
  const { regions } = getSkipRegions(code)
  if (regions.some(r => slashMatch.from >= r.start && slashMatch.from < r.end)) {
    return null
  }

  return {
    from: slashMatch.from + (slashMatch.text.length - slashMatch.text.trimStart().length),
    options: snippetOptions,
  }
}

function hydraLinter (view: EditorView): Diagnostic[] {
  const code = view.state.doc.toString()
  const diagnostics: Diagnostic[] = lintHydraCode(code).map(d => ({
    from: d.from,
    to: d.to,
    severity: d.severity,
    message: d.message,
  }))

  // Lint modified injected lines
  const doc = view.state.doc
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    if (isPartialInjectedLine(line.text)) {
      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: 'info',
        message: 'Modified audio injection — remove or reapply manually',
      })
    }
  }

  return diagnostics
}

/** CM6 ViewPlugin: highlight auto-injected lines with a subtle teal background */
const injectedLineDeco = Decoration.line({ class: 'cm-injected-line' })

const injectedLinePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor (view: EditorView) {
      this.decorations = this.build(view)
    }

    update (update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = this.build(update.view)
      }
    }

    build (view: EditorView): DecorationSet {
      const ranges: Range<Decoration>[] = []
      const doc = view.state.doc
      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i)
        if (isInjectedLine(line.text)) {
          ranges.push(injectedLineDeco.range(line.from))
        }
      }
      return Decoration.set(ranges)
    }
  },
  { decorations: v => v.decorations },
)

/**
 * Find the insertion point after leading comment block (// and /* ... * / lines).
 * Returns the character offset where sN.initCam() should be inserted.
 */
function findCameraInsertLine (code: string): number {
  const lines = code.split('\n')
  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trimStart()
    if (trimmed === '' || trimmed.startsWith('//')) {
      i++
      continue
    }
    if (trimmed.startsWith('/*')) {
      // Skip until closing */
      while (i < lines.length && !lines[i].includes('*/')) i++
      i++ // skip the line with */
      continue
    }
    break
  }
  return i
}

interface CodeEditorProps {
  code: string
  onCodeChange: (code: string) => void
  onSend: (code: string) => void
  sendStatus?: 'idle' | 'sending' | 'synced' | 'error'
  onResend?: () => void
  onRandomize: () => void
  cameraStatus?: 'idle' | 'connecting' | 'active' | 'error'
  onCameraToggle?: () => void
}

function CodeEditor ({
  code,
  onCodeChange,
  onSend,
  sendStatus = 'idle',
  onResend,
  onRandomize,
  cameraStatus,
  onCameraToggle,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onCodeChangeRef = useRef(onCodeChange)
  const onSendRef = useRef(onSend)
  const codeRef = useRef(code)
  const sendAttemptRef = useRef<() => void>(() => {})
  const [sendLintError, setSendLintError] = useState<LintErrorSummary | null>(null)

  onCodeChangeRef.current = onCodeChange
  onSendRef.current = onSend
  codeRef.current = code

  useEffect(() => {
    if (!containerRef.current) return

    const sendKeymap = keymap.of([{
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        sendAttemptRef.current()
        return true
      },
    }])

    const state = EditorState.create({
      doc: code,
      extensions: [
        sendKeymap,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        indentUnit.of('  '),
        javascript(),
        hydraExtensions,
        autocompletion({ override: [hydraAutocomplete, slashCommandComplete] }),
        linter(hydraLinter),
        injectedLinePlugin,
        hydraTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onCodeChangeRef.current(update.state.doc.toString())
            setSendLintError(null)
          }
        }),
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external code prop changes into CM6
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentDoc = view.state.doc.toString()
    if (code === currentDoc) return
    view.dispatch({
      changes: { from: 0, to: currentDoc.length, insert: code },
    })
  }, [code])

  sendAttemptRef.current = () => {
    const currentCode = viewRef.current?.state.doc.toString() ?? codeRef.current
    const summary = getLintErrorSummary(currentCode)
    if (summary) {
      setSendLintError(summary)
      viewRef.current?.focus()
      return
    }
    setSendLintError(null)
    onSendRef.current(currentCode)
  }

  const handleSend = useCallback(() => {
    sendAttemptRef.current()
  }, [])

  const handleUndo = useCallback(() => {
    if (!viewRef.current) return
    undo(viewRef.current)
    viewRef.current.focus()
  }, [])

  const handleRedo = useCallback(() => {
    if (!viewRef.current) return
    redo(viewRef.current)
    viewRef.current.focus()
  }, [])

  const handleFormat = useCallback(() => {
    const view = viewRef.current
    if (!view) return
    const currentCode = view.state.doc.toString()
    const formatted = formatHydraCode(currentCode)
    if (formatted === currentCode) return
    view.dispatch({
      changes: { from: 0, to: currentCode.length, insert: formatted },
    })
    view.focus()
  }, [])

  // Camera banner: show when code uses src(sN) without init
  const cameraUsage = useMemo(() => detectCameraUsage(code), [code])
  const [cameraBannerDismissed, setCameraBannerDismissed] = useState(false)
  const prevSourcesRef = useRef<string[]>([])

  // Reset dismiss when new sources appear
  useEffect(() => {
    const prev = prevSourcesRef.current
    const cur = cameraUsage.sources
    if (cur.some(s => !prev.includes(s))) {
      setCameraBannerDismissed(false)
    }
    prevSourcesRef.current = cur
  }, [cameraUsage.sources])

  const showCameraBanner = cameraUsage.sources.length > 0
    && !cameraUsage.hasExplicitInit
    && !cameraBannerDismissed

  const handleEnableCamera = useCallback(() => {
    const lines = code.split('\n')
    const insertAt = findCameraInsertLine(code)
    const initLines = cameraUsage.sources.map(s => `${s}.initCam()`)
    lines.splice(insertAt, 0, ...initLines)
    onCodeChange(lines.join('\n'))
  }, [code, cameraUsage.sources, onCodeChange])

  const handleDismissCamera = useCallback(() => {
    setCameraBannerDismissed(true)
  }, [])

  const showSendStatus = sendStatus !== 'idle'

  return (
    <div className={styles.container}>
      {showCameraBanner && (
        <div className={styles.cameraBanner}>
          <span>
            This sketch uses camera source (
            {cameraUsage.sources.join(', ')}
            )
          </span>
          <button type='button' className={styles.cameraBannerEnable} onClick={handleEnableCamera}>
            Enable Camera
          </button>
          <button type='button' className={styles.cameraBannerDismiss} onClick={handleDismissCamera}>
            Dismiss
          </button>
        </div>
      )}
      <div ref={containerRef} className={styles.editor} />
      <div className={styles.footer}>
        <span className={styles.hint}>Ctrl+Enter to send</span>
        <div className={styles.editActions}>
          <button type='button' className={styles.editButton} onClick={handleUndo}>Undo</button>
          <button type='button' className={styles.editButton} onClick={handleRedo}>Redo</button>
          <button type='button' className={styles.editButton} onClick={handleFormat}>Format</button>
        </div>
        <div className={styles.audioVars}>
          <span>a.fft[n]</span>
          <span>a.setBins(n)</span>
          <span>a.setSmooth(v)</span>
          <span>a.setScale(v)</span>
        </div>
        <button type='button' className={styles.randomButton} onClick={onRandomize}>
          Random
        </button>
        {onCameraToggle && (
          <button
            type='button'
            className={`${styles.randomButton} ${cameraStatus === 'active' ? styles.sendButton : ''}`}
            onClick={onCameraToggle}
            title={cameraStatus === 'idle' ? 'Share camera' : cameraStatus === 'connecting' ? 'Connecting...' : cameraStatus === 'active' ? 'Stop camera' : 'Camera error'}
          >
            {cameraStatus === 'idle' ? 'Cam' : cameraStatus === 'connecting' ? 'Cam...' : cameraStatus === 'active' ? 'Cam On' : 'Cam Err'}
          </button>
        )}
        <div className={styles.sendGroup}>
          <button type='button' className={styles.sendButton} onClick={handleSend}>
            {sendStatus === 'sending' ? 'Sending…' : 'Send'}
          </button>
          {showSendStatus && sendStatus !== 'sending' && (
            <span
              className={`${styles.sendStatus} ${sendStatus === 'error' ? styles.sendStatusError : styles.sendStatusOk}`}
            >
              {sendStatus === 'synced' ? 'Synced' : 'Send failed'}
            </span>
          )}
          {sendLintError && (
            <>
              <span className={styles.sendLintError}>
                {`Fix ${sendLintError.count} error${sendLintError.count > 1 ? 's' : ''} (line ${sendLintError.firstLine})`}
              </span>
              <span className={styles.sendLintDebug}>{sendLintError.debugHint}</span>
            </>
          )}
          {sendStatus === 'error' && onResend && (
            <button type='button' className={styles.resendButton} onClick={onResend}>
              Resend
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
