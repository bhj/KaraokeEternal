import React, { useCallback, useMemo, useState } from 'react'
import type { VisualizerMode } from 'shared/types'
import { detectCameraUsage } from 'lib/detectCameraUsage'
import HydraPreview from './HydraPreview'
import styles from './StagePanel.css'
import { BUFFER_OPTIONS, buildPreviewCode, type StageBuffer } from './stagePanelUtils'
import PresetPicker from './PresetPicker'
import { getCameraPipelineState, type CameraRelayStatus } from './hydraPreviewUtils'

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
  cameraRelayStatus: CameraRelayStatus
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
  cameraRelayStatus,
}: StagePanelProps) {
  const previewCode = useMemo(() => buildPreviewCode(code, buffer), [code, buffer])
  const cameraUsage = useMemo(() => detectCameraUsage(previewCode), [previewCode])
  const [boundCameraSources, setBoundCameraSources] = useState<string[]>([])

  const usesCameraSource = cameraUsage.sources.length > 0
  const boundSourceCount = usesCameraSource ? boundCameraSources.length : 0

  const cameraPipeline = useMemo(() => getCameraPipelineState({
    cameraStatus: cameraRelayStatus,
    usesCameraSource,
    boundSourceCount,
  }), [boundSourceCount, cameraRelayStatus, usesCameraSource])

  const showCameraPipeline = visualizerEnabled
    && visualizerMode === 'hydra'
    && (usesCameraSource || cameraRelayStatus !== 'idle')

  const cameraPipelineClass = cameraPipeline.level === 'live'
    ? styles.cameraPipelineLive
    : cameraPipeline.level === 'partial'
      ? styles.cameraPipelinePartial
      : styles.cameraPipelineOff

  const handleCameraBoundSourcesChange = useCallback((sources: string[]) => {
    setBoundCameraSources((prev) => {
      if (prev.length === sources.length && prev.every((value, index) => value === sources[index])) {
        return prev
      }
      return sources
    })
  }, [])

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
        <div className={styles.stageHeaderRight}>
          {showCameraPipeline && (
            <div className={`${styles.cameraPipeline} ${cameraPipelineClass}`}>
              <span className={styles.cameraPipelineLabel}>{`Camera ${cameraPipeline.label}`}</span>
              {cameraPipeline.level === 'partial' && cameraPipeline.missing.length > 0 && (
                <span className={styles.cameraPipelineDetail}>{`Missing: ${cameraPipeline.missing.join(', ')}`}</span>
              )}
            </div>
          )}
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
            onCameraBoundSourcesChange={handleCameraBoundSourcesChange}
          />
        </div>
      </div>
    </div>
  )
}

export default StagePanel
