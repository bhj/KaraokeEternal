import React, { useMemo } from 'react'
import type { AudioResponseState, VisualizerMode } from 'shared/types'
import HydraPreview from './HydraPreview'
import styles from './StagePanel.css'
import { BUFFER_OPTIONS, buildPreviewCode, type StageBuffer } from './stagePanelUtils'
import PresetPicker from './PresetPicker'

interface StagePanelProps {
  code: string
  width: number
  height: number
  buffer: StageBuffer
  onBufferChange: (buffer: StageBuffer) => void
  localCameraStream?: MediaStream | null
  onPresetLoad?: (code: string) => void
  onPresetSend?: (code: string) => void
  onRandomize?: () => void
  visualizerMode: VisualizerMode
  visualizerEnabled: boolean
  visualizerSensitivity: number
  visualizerAllowCamera: boolean
  visualizerAudioResponse: AudioResponseState
  playerFrameDataUrl?: string | null
  playerFrameTimestamp?: number | null
  isPlayerPresent?: boolean
}

function StagePanel ({
  code,
  width,
  height,
  buffer,
  onBufferChange,
  localCameraStream,
  onPresetLoad,
  onPresetSend,
  onRandomize,
  visualizerMode,
  visualizerEnabled,
  visualizerSensitivity,
  visualizerAllowCamera,
  visualizerAudioResponse,
  playerFrameDataUrl,
  playerFrameTimestamp,
  isPlayerPresent,
}: StagePanelProps) {
  const previewCode = useMemo(() => buildPreviewCode(code, buffer), [code, buffer])

  return (
    <div className={styles.stage}>
      <div className={styles.stageHeader}>
        <div className={styles.stageHeaderLeft}>
          <div className={styles.stageTitle}>
            Stage
            <span className={styles.stageHint}>Preview</span>
          </div>
          {(onPresetLoad || onPresetSend || onRandomize) && (
            <PresetPicker
              onLoad={onPresetLoad}
              onSend={onPresetSend}
              onRandomize={onRandomize}
            />
          )}
        </div>
        <div className={styles.bufferControls}>
          {BUFFER_OPTIONS.map(option => (
            <button
              key={option.key}
              type='button'
              className={`${styles.bufferButton} ${buffer === option.key ? styles.bufferButtonActive : ''}`}
              onClick={() => onBufferChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.stageBody}>
        <div className={styles.stageFrame}>
          <HydraPreview
            code={previewCode}
            width={width}
            height={height}
            localCameraStream={localCameraStream}
            mode={visualizerMode}
            isEnabled={visualizerEnabled}
            sensitivity={visualizerSensitivity}
            allowCamera={visualizerAllowCamera}
            audioResponse={visualizerAudioResponse}
          />
        </div>
        <aside className={styles.playerMirror}>
          <div className={styles.playerMirrorHeader}>
            <span>Player Feed</span>
            {playerFrameTimestamp && (
              <span className={styles.playerMirrorMeta}>
                {new Date(playerFrameTimestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          {playerFrameDataUrl
            ? (
                <img
                  src={playerFrameDataUrl}
                  alt='Live player reference frame'
                  className={styles.playerMirrorImage}
                />
              )
            : (
                <div className={styles.playerMirrorPlaceholder}>
                  {isPlayerPresent
                    ? 'Waiting for player mirror frames...'
                    : 'No active player feed'}
                </div>
              )}
        </aside>
      </div>
    </div>
  )
}

export default StagePanel
