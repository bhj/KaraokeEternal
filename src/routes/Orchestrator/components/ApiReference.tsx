import React, { useState, useCallback } from 'react'
import { AUDIO_REFERENCE, HYDRA_REFERENCE } from './hydraReference'
import styles from './ApiReference.css'

function ApiReference () {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const toggleCategory = useCallback((label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }, [])

  return (
    <div className={styles.panel}>
      <div className={`${styles.section} ${styles.audioSection}`}>
        <div className={styles.sectionHeader}>Audio</div>
        {AUDIO_REFERENCE.map(ref => (
          <div key={ref.name} className={styles.audioItem}>
            <span className={styles.audioName}>{ref.name}</span>
            <span className={styles.audioRange}>{ref.range}</span>
            <span className={styles.audioDesc}>{ref.description}</span>
          </div>
        ))}
        <div className={styles.autoAudioNote}>
          {'Non-audio sketches get .modulate + .rotate lines injected with a.fft values. '
            + 'The injected code is shown in the editor. Sending from the Orchestrator '
            + 'broadcasts the editor contents (including injected lines) to all connected '
            + 'players. Deleting the injected lines disables auto-audio for the current '
            + 'session, but incoming remote updates or preset changes will re-inject. '
            + 'To permanently disable, add an explicit audio call (e.g. a.fft[0]) '
            + 'anywhere in the sketch. The preview uses simulated audio, so injected '
            + 'lines produce visible movement even without music.'}
        </div>
      </div>

      {HYDRA_REFERENCE.map(cat => (
        <div key={cat.label} className={styles.section}>
          <div
            className={styles.sectionHeader}
            style={{ borderLeft: `3px solid ${cat.color}` }}
            onClick={() => toggleCategory(cat.label)}
          >
            <span className={styles.sectionToggle}>
              {expanded.has(cat.label) ? '\u25BC' : '\u25B6'}
            </span>
            {cat.label}
          </div>
          {expanded.has(cat.label) && cat.functions.map((fn) => {
            const sig = `(${fn.params.map(p => p.name).join(', ')})`
            return (
              <div key={fn.name} className={styles.funcItem}>
                {fn.name}
                <span className={styles.funcParams}>
                  {sig}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default ApiReference
