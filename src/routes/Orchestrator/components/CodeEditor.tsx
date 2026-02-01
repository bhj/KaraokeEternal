import React, { useCallback, useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { linter, type Diagnostic } from '@codemirror/lint'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { buildHydraCompletions } from './hydraCompletions'
import { lintHydraCode } from './hydraLint'
import styles from './CodeEditor.css'

const { topLevel, dotChain } = buildHydraCompletions()

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
})

function hydraAutocomplete (context: CompletionContext): CompletionResult | null {
  // Dot-chain: triggered after a dot
  const dotMatch = context.matchBefore(/\.\w*/)
  if (dotMatch) {
    return {
      from: dotMatch.from,
      options: dotChain.map(c => ({
        label: c.label,
        detail: c.detail,
        section: c.section,
      })),
    }
  }

  // Top-level: triggered on word chars or explicitly
  const wordMatch = context.matchBefore(/\w+/)
  if (wordMatch || context.explicit) {
    return {
      from: wordMatch?.from ?? context.pos,
      options: topLevel.map(c => ({
        label: c.label,
        detail: c.detail,
        section: c.section,
      })),
    }
  }

  return null
}

function hydraLinter (view: EditorView): Diagnostic[] {
  const code = view.state.doc.toString()
  return lintHydraCode(code).map(d => ({
    from: d.from,
    to: d.to,
    severity: d.severity,
    message: d.message,
  }))
}

interface CodeEditorProps {
  code: string
  onCodeChange: (code: string) => void
  onSend: (code: string) => void
  onRandomize: () => void
}

function CodeEditor ({ code, onCodeChange, onSend, onRandomize }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onCodeChangeRef = useRef(onCodeChange)
  const onSendRef = useRef(onSend)
  const codeRef = useRef(code)

  onCodeChangeRef.current = onCodeChange
  onSendRef.current = onSend
  codeRef.current = code

  useEffect(() => {
    if (!containerRef.current) return

    const sendKeymap = keymap.of([{
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        onSendRef.current(viewRef.current?.state.doc.toString() ?? '')
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
        autocompletion({ override: [hydraAutocomplete] }),
        linter(hydraLinter),
        hydraTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onCodeChangeRef.current(update.state.doc.toString())
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

  const handleSend = useCallback(() => {
    onSend(viewRef.current?.state.doc.toString() ?? code)
  }, [code, onSend])

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.editor} />
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
          <span>a.fft[n]</span>
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
