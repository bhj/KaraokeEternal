import React, { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Modal, { ModalProps } from 'components/Modal/Modal'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import DisplayCtrl from './DisplayCtrl/DisplayCtrl'
import AudioCtrl from './AudioCtrl/AudioCtrl'
import styles from './PlayerOptions.css'
import { MediaType, PlaybackOptions } from 'shared/types'

const TABS = [
  { id: 'display', label: 'Display', icon: 'TV' },
  { id: 'audio', label: 'Audio', icon: 'MUSIC_NOTE' },
] as const

type TabId = typeof TABS[number]['id']

let lastActiveTab: TabId = 'display'

interface PlayerOptionsProps {
  cdgAlpha: number
  cdgSize: number
  globalPitch: number
  isPitchSupported: boolean
  isVideoKeyingEnabled: boolean
  isVisualizerEnabled: boolean
  isWebGLSupported: boolean
  mediaType?: MediaType
  mp4Alpha: number
  pitch: number
  sensitivity: number
  userPitch: number | null
  visualizerPresetName: string
  // actions
  onRequestOptions(opts: PlaybackOptions): void
  onSetGlobalPitch?(pitch: number): void
  onSetUserPitch?(pitch: number | null): void
  onClose: ModalProps['onClose']
}

const PlayerOptions = ({
  cdgAlpha,
  cdgSize,
  globalPitch,
  isPitchSupported,
  isVideoKeyingEnabled,
  isVisualizerEnabled,
  isWebGLSupported,
  mediaType,
  mp4Alpha,
  pitch,
  sensitivity,
  userPitch,
  visualizerPresetName,
  onRequestOptions,
  onSetGlobalPitch,
  onSetUserPitch,
  onClose,
}: PlayerOptionsProps) => {
  const [activeTab, setActiveTab] = useState<TabId>(lastActiveTab)
  const [animatingTab, setAnimatingTab] = useState<TabId | null>(null)
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})

  useEffect(() => {
    lastActiveTab = activeTab
  }, [activeTab])

  const selectTab = (id: TabId) => {
    if (id !== activeTab) setAnimatingTab(id)
    setActiveTab(id)
  }

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

    const curIdx = TABS.findIndex(tab => tab.id === activeTab)
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const nextTab = TABS[(curIdx + delta + TABS.length) % TABS.length].id

    selectTab(nextTab)
    tabRefs.current[nextTab]?.focus()
  }

  return (
    <Modal
      aria-label='Player Options'
      className={styles.modal}
      headingClassName={styles.tabRow}
      onClose={onClose}
      headingComponent={(
        <div className={styles.tabs} role='tablist' aria-label='Options'>
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              ref={(el) => { tabRefs.current[id] = el }}
              className={clsx(styles.tab, animatingTab === id && styles.tabAnimate)}
              type='button'
              role='tab'
              id={`tab-${id}`}
              aria-label={label}
              aria-selected={activeTab === id}
              aria-controls={`tabpanel-${id}`}
              onClick={() => selectTab(id)}
              onKeyDown={handleTabKeyDown}
              onAnimationEnd={() => setAnimatingTab(null)}
            >
              <Icon icon={icon} />
            </button>
          ))}
        </div>
      )}
      buttons={<Button variant='primary' onClick={onClose}>Done</Button>}
    >
      <div className={styles.panels}>
        <div
          className={clsx(styles.panel, activeTab !== 'display' && styles.panelHidden)}
          role='tabpanel'
          id='tabpanel-display'
          aria-labelledby='tab-display'
        >
          <DisplayCtrl
            cdgAlpha={cdgAlpha}
            cdgSize={cdgSize}
            isVideoKeyingEnabled={isVideoKeyingEnabled}
            isVisualizerEnabled={isVisualizerEnabled}
            isWebGLSupported={isWebGLSupported}
            mediaType={mediaType}
            mp4Alpha={mp4Alpha}
            onRequestOptions={onRequestOptions}
            sensitivity={sensitivity}
            visualizerPresetName={visualizerPresetName}
          />
        </div>

        <div
          className={clsx(styles.panel, activeTab !== 'audio' && styles.panelHidden)}
          role='tabpanel'
          id='tabpanel-audio'
          aria-labelledby='tab-audio'
        >
          <AudioCtrl
            globalPitch={globalPitch}
            isPitchSupported={isPitchSupported}
            mediaType={mediaType}
            pitch={pitch}
            userPitch={userPitch}
            onRequestOptions={onRequestOptions}
            onSetGlobalPitch={onSetGlobalPitch}
            onSetUserPitch={onSetUserPitch}
          />
        </div>
      </div>
    </Modal>
  )
}

export default PlayerOptions
