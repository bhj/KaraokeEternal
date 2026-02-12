import React, { useMemo, useState, useCallback } from 'react'
import { AUDIO_REFERENCE, HYDRA_REFERENCE, type HydraFuncRef } from './hydraReference'
import styles from './ApiReference.css'

interface ApiReferenceProps {
  onInsertExample?: (code: string) => void
  onReplaceWithExample?: (code: string) => void
}

interface HydraEntry {
  id: string
  category: string
  color: string
  func: HydraFuncRef
}

function formatDefaultValue (value: number | string): string {
  return typeof value === 'number' ? String(value) : value
}

function getSignature (func: HydraFuncRef): string {
  return `${func.name}(${func.params.map(param => param.name).join(', ')})`
}

function getCategorySummary (category: string): string {
  switch (category) {
    case 'Sources':
      return 'Generate base textures and route source buffers into your chain.'
    case 'Transforms':
      return 'Reposition and repeat geometry to create motion and structure.'
    case 'Color':
      return 'Shape palette, contrast, and tonal behavior of the signal.'
    case 'Combine':
      return 'Blend multiple textures into one output layer.'
    case 'Modulate':
      return 'Drive one texture using another texture as a control signal.'
    case 'Camera / External Sources':
      return 'Initialize camera, image, video, or screen sources for `src(sN)` usage.'
    default:
      return 'Hydra function reference entry.'
  }
}

function getFunctionExample (entry: HydraEntry): string {
  const { func } = entry
  if (typeof func.example === 'string' && func.example.trim().length > 0) {
    return func.example
  }

  const args = func.params.map(param => formatDefaultValue(param.default)).join(', ')

  if (func.name.startsWith('.')) {
    return `osc(10, 0.1, 0)\n  ${func.name}(${args})\n  .out(o0)`
  }

  if (func.name.endsWith('.initCam') || func.name.endsWith('.initImage') || func.name.endsWith('.initVideo') || func.name.endsWith('.initScreen')) {
    const source = func.name.split('.')[0]
    return `${func.name}(${args})\nsrc(${source}).out(o0)`
  }

  if (func.name === 'prev') {
    return 'src(o0).blend(prev(), 0.5).out(o0)'
  }

  return `${func.name}(${args}).out(o0)`
}

function getFunctionSlug (name: string): string {
  return name
    .replace(/^\./, '')
    .replace(/^s[0-3]\./, '')
}

function getApiReferenceLink (name: string): string {
  const slug = getFunctionSlug(name)
  return `https://hydra.ojack.xyz/api/#functions/${slug}/0`
}

function getDocsSearchLink (name: string): string {
  const query = encodeURIComponent(getFunctionSlug(name))
  return `https://github.com/hydra-synth/hydra-docs-v2/search?q=${query}&type=code`
}

function ApiReference ({ onInsertExample, onReplaceWithExample }: ApiReferenceProps) {
  const [query, setQuery] = useState('')

  const entries = useMemo<HydraEntry[]>(() => HYDRA_REFERENCE.flatMap(category => (
    category.functions.map(func => ({
      id: `${category.label}:${func.name}`,
      category: category.label,
      color: category.color,
      func,
    }))
  )), [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (normalized.length === 0) return entries
    return entries.filter((entry) => {
      const signature = getSignature(entry.func)
      const haystack = [
        entry.func.name,
        signature,
        entry.category,
      ].join(' ').toLowerCase()
      return haystack.includes(normalized)
    })
  }, [entries, query])

  const [selectedId, setSelectedId] = useState(() => entries[0]?.id ?? '')

  const selectedEntry = useMemo(() => {
    const match = filtered.find(entry => entry.id === selectedId)
    return match ?? filtered[0] ?? null
  }, [filtered, selectedId])

  const activeId = selectedEntry?.id ?? ''
  const selectedSignature = selectedEntry ? getSignature(selectedEntry.func) : ''
  const selectedExample = selectedEntry ? getFunctionExample(selectedEntry) : ''
  const selectedApiLink = selectedEntry ? getApiReferenceLink(selectedEntry.func.name) : '#'
  const selectedDocsLink = selectedEntry ? getDocsSearchLink(selectedEntry.func.name) : '#'

  const handleInsertExample = useCallback(() => {
    if (!selectedExample || !onInsertExample) return
    onInsertExample(selectedExample)
  }, [onInsertExample, selectedExample])

  const handleReplaceWithExample = useCallback(() => {
    if (!selectedExample || !onReplaceWithExample) return
    onReplaceWithExample(selectedExample)
  }, [onReplaceWithExample, selectedExample])

  const handleCopySignature = useCallback(() => {
    if (!selectedSignature) return
    if (typeof navigator === 'undefined') return
    if (!('clipboard' in navigator) || !navigator.clipboard?.writeText) return
    void navigator.clipboard.writeText(selectedSignature)
  }, [selectedSignature])

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <h2 className={styles.title}>Hydra Function Lab</h2>
        <p className={styles.subtitle}>Learn by exploring signatures and examples</p>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Search</span>
          <input
            type='search'
            className={styles.searchInput}
            value={query}
            onChange={event => setQuery(event.currentTarget.value)}
            onInput={event => setQuery((event.target as HTMLInputElement).value)}
            placeholder='e.g. modulateRotate, initCam, color'
          />
        </label>
      </header>

      <section className={styles.audioStrip} aria-label='Audio Quick Reference'>
        {AUDIO_REFERENCE.map(ref => (
          <article key={ref.name} className={styles.audioCard}>
            <div className={styles.audioName}>{ref.name}</div>
            <div className={styles.audioRange}>{ref.range}</div>
            <div className={styles.audioDescription}>{ref.description}</div>
          </article>
        ))}
      </section>

      <div className={styles.workspaceBody}>
        <section className={styles.functionList} aria-label='Function List'>
          {filtered.map(entry => (
            <button
              type='button'
              key={entry.id}
              className={`${styles.functionItem} ${entry.id === activeId ? styles.functionItemActive : ''}`}
              onClick={() => setSelectedId(entry.id)}
              aria-selected={entry.id === activeId}
            >
              <div className={styles.functionTopRow}>
                <span className={styles.functionName}>{entry.func.name}</span>
                <span className={styles.functionCategory} style={{ borderColor: entry.color }}>{entry.category}</span>
              </div>
              <div className={styles.functionSignature}>{getSignature(entry.func)}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className={styles.emptyState}>No functions match this search.</div>
          )}
        </section>

        <section className={styles.detailPane} aria-label='Function Detail'>
          {selectedEntry && (
            <>
              <div className={styles.detailHeader}>
                <h3 className={styles.detailName}>{selectedEntry.func.name}</h3>
                <p className={styles.detailSummary}>{selectedEntry.func.description ?? getCategorySummary(selectedEntry.category)}</p>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>When to use</div>
                <p className={styles.detailText}>{selectedEntry.func.whenToUse ?? getCategorySummary(selectedEntry.category)}</p>
              </div>
              {selectedEntry.func.related && selectedEntry.func.related.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>Related</div>
                  <div className={styles.relatedRow}>
                    {selectedEntry.func.related.map(name => (
                      <span key={name} className={styles.relatedChip}>{name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>References</div>
                <div className={styles.referenceLinks}>
                  <a className={styles.referenceLink} href={selectedApiLink} target='_blank' rel='noreferrer'>
                    Open API Reference
                  </a>
                  <a className={styles.referenceLink} href={selectedDocsLink} target='_blank' rel='noreferrer'>
                    Search Docs V2
                  </a>
                </div>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Parameters</div>
                {selectedEntry.func.params.length > 0
                  ? (
                      <ul className={styles.paramList}>
                        {selectedEntry.func.params.map(param => (
                          <li key={param.name} className={styles.paramItem}>
                            <span className={styles.paramName}>{param.name}</span>
                            <span className={styles.paramMeta}>{`default: ${formatDefaultValue(param.default)}`}</span>
                            {param.range && <span className={styles.paramMeta}>{`range: ${param.range}`}</span>}
                          </li>
                        ))}
                      </ul>
                    )
                  : <p className={styles.noParams}>No parameters.</p>}
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Example</div>
                <pre className={styles.exampleBlock}><code>{selectedExample}</code></pre>
              </div>

              <div className={styles.actions}>
                <button type='button' className={styles.actionButton} onClick={handleCopySignature}>
                  Copy Signature
                </button>
                <button type='button' className={styles.actionButton} onClick={handleInsertExample}>
                  Insert Example
                </button>
                <button type='button' className={styles.actionButtonSecondary} onClick={handleReplaceWithExample}>
                  Replace Editor
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default ApiReference
