import React, { useState, useMemo, useCallback } from 'react'
import { HYDRA_GALLERY } from './hydraGallery'
import { decodeSketch } from './hydraPresets'
import { buildPresetItems, filterPresets, type PresetBrowserItem } from './presetBrowser'
import styles from './PresetBrowser.css'

const allItems = buildPresetItems(HYDRA_GALLERY)
const ALL_TAGS = ['camera', 'feedback', 'kaleid', 'tuned'] as const

interface PresetBrowserProps {
  onLoad: (code: string) => void
  onSend: (code: string) => void
}

function PresetBrowser ({ onLoad, onSend }: PresetBrowserProps) {
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const filtered = useMemo(
    () => filterPresets(allItems, query, activeTags),
    [query, activeTags],
  )

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag],
    )
  }, [])

  const handleLoad = useCallback((item: PresetBrowserItem) => {
    onLoad(decodeSketch(HYDRA_GALLERY[item.index]))
  }, [onLoad])

  const handleSend = useCallback((item: PresetBrowserItem) => {
    onSend(decodeSketch(HYDRA_GALLERY[item.index]))
  }, [onSend])

  return (
    <div className={styles.panel}>
      <input
        className={styles.searchInput}
        type='text'
        placeholder='Search presets...'
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div className={styles.tags}>
        {ALL_TAGS.map(tag => {
          const tagLabel = tag === 'camera' ? 'Cam' : tag === 'feedback' ? 'Feedback' : tag === 'kaleid' ? 'Kaleid' : 'Tuned'
          const tagStyle = tag === 'camera' ? styles.tagCamera : tag === 'feedback' ? styles.tagFeedback : tag === 'kaleid' ? styles.tagKaleid : styles.tagTuned
          return (
            <button
              key={tag}
              type='button'
              className={`${styles.tag} ${tagStyle} ${activeTags.includes(tag) ? styles.tagActive : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tagLabel}
            </button>
          )
        })}
      </div>
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No presets match</div>
        )}
        {filtered.map(item => (
          <div key={item.index} className={styles.card}>
            <div className={styles.cardName}>{item.sketchId}</div>
            {(item.category !== 'default' || item.hasAudioProfile) && (
              <div className={styles.cardBadges}>
                {item.category === 'camera' && <span className={`${styles.badge} ${styles.badgeCamera}`}>Cam</span>}
                {item.category === 'feedback' && <span className={`${styles.badge} ${styles.badgeFeedback}`}>Feedback</span>}
                {item.category === 'kaleid' && <span className={`${styles.badge} ${styles.badgeKaleid}`}>Kaleid</span>}
                {item.hasAudioProfile && <span className={`${styles.badge} ${styles.badgeTuned}`}>Tuned</span>}
              </div>
            )}
            <div className={styles.cardButtons}>
              <button type='button' className={styles.cardBtn} onClick={() => handleLoad(item)}>
                Load
              </button>
              <button type='button' className={`${styles.cardBtn} ${styles.cardBtnSend}`} onClick={() => handleSend(item)}>
                Send
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PresetBrowser
