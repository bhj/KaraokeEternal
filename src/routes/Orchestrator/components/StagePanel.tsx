import React, { useMemo } from 'react'
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
  onPresetLoad?: (code: string) => void
  onPresetSend?: (code: string) => void
  onRandomize?: () => void
}

function StagePanel ({
  code,
  width,
  height,
  buffer,
  onBufferChange,
  onPresetLoad,
  onPresetSend,
  onRandomize,
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
          />
        </div>
      </div>
    </div>
  )
}

export default StagePanel
