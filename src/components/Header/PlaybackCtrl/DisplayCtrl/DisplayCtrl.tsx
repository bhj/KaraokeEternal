import React from 'react'
import clsx from 'clsx'
import Modal, { ModalProps } from 'components/Modal/Modal'
import Button from 'components/Button/Button'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Slider from 'components/Slider/Slider'
import Icon from 'components/Icon/Icon'
import styles from './DisplayCtrl.css'
import type { AudioResponseState, MediaType, PlaybackOptions, VisualizerMode } from 'shared/types'
import { AUDIO_RESPONSE_DEFAULTS } from 'shared/types'

interface DisplayCtrlProps {
  cdgAlpha: number
  cdgSize: number
  isVideoKeyingEnabled: boolean
  isVisualizerEnabled: boolean
  isWebGLSupported: boolean
  mediaType?: MediaType
  mp4Alpha: number
  sensitivity: number
  visualizerPresetName: string
  visualizerMode: VisualizerMode
  audioResponse: AudioResponseState
  // actions
  onRequestOptions(opts: PlaybackOptions): void
  onHydraPresetChange(direction: 'next' | 'prev' | 'random'): void
  onClose: ModalProps['onClose']
}

// Visualizer mode options
const VISUALIZER_MODES: { value: VisualizerMode, label: string }[] = [
  { value: 'hydra', label: 'Hydra' },
  { value: 'off', label: 'Off' },
]

const DisplayCtrl = ({
  cdgAlpha,
  cdgSize,
  isVideoKeyingEnabled,
  isVisualizerEnabled,
  isWebGLSupported,
  mediaType = '',
  mp4Alpha,
  sensitivity,
  visualizerPresetName,
  visualizerMode,
  audioResponse,
  onRequestOptions,
  onHydraPresetChange,
  onClose,
}: DisplayCtrlProps) => {
  const handleAlpha = (val: number) => {
    if (mediaType === '') return
    onRequestOptions({ [mediaType + 'Alpha']: val })
  }

  const handleSensitivity = (val: number) => onRequestOptions({
    visualizer: { sensitivity: val },
  })

  const handleSize = (val: number) => {
    onRequestOptions({ cdgSize: val })
  }

  const handleToggleVisualizer = () => onRequestOptions({
    visualizer: { isEnabled: !isVisualizerEnabled },
  })

  const handlePresetNext = () => onHydraPresetChange('next')
  const handlePresetPrev = () => onHydraPresetChange('prev')
  const handlePresetRandom = () => onHydraPresetChange('random')

  const handleModeChange = (mode: VisualizerMode) => onRequestOptions({
    visualizer: { mode },
  })

  const handleAudioResponseField = (field: keyof AudioResponseState, val: number) =>
    onRequestOptions({ visualizer: { audioResponse: { ...audioResponse, [field]: val } } })

  const handleResetAudioResponse = () =>
    onRequestOptions({ visualizer: { audioResponse: AUDIO_RESPONSE_DEFAULTS } })

  // Show preset controls for hydra mode
  const showPresets = visualizerMode === 'hydra'
  const showAudioResponse = visualizerMode === 'hydra'

  return (
    <Modal
      className={styles.modal}
      onClose={onClose}
      title='Display'
      buttons={<Button variant='primary' onClick={onClose}>Done</Button>}
    >
      <div className={styles.container}>
        <div className={clsx(styles.section, styles.visualizer)}>
          <fieldset>
            <legend>
              <InputCheckbox
                label='Visualizer'
                checked={isVisualizerEnabled}
                disabled={!isWebGLSupported}
                onChange={handleToggleVisualizer}
              />
            </legend>

            {isWebGLSupported && (mediaType === 'cdg' || isVideoKeyingEnabled) && (
              <>
                <div className={styles.field}>
                  <label id='label-visualizer-mode'>Mode</label>
                  <div className={styles.modeButtons}>
                    {VISUALIZER_MODES.map(({ value, label }) => (
                      <Button
                        key={value}
                        onClick={() => handleModeChange(value)}
                        variant={visualizerMode === value ? 'primary' : 'default'}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {showPresets && (
                  <div className={styles.presetContainer}>
                    <div className={styles.presetButtons}>
                      <Button
                        onClick={handlePresetPrev}
                        aria-label='Previous preset'
                        aria-controls='visualizer-preset-name'
                      >
                        <Icon icon='CHEVRON_LEFT' />
                      </Button>
                      <Button
                        onClick={handlePresetRandom}
                        aria-label='Random preset'
                        aria-controls='visualizer-preset-name'
                      >
                        <Icon icon='DICE' />
                      </Button>
                      <Button
                        onClick={handlePresetNext}
                        aria-label='Next preset'
                        aria-controls='visualizer-preset-name'
                      >
                        <Icon icon='CHEVRON_RIGHT' />
                      </Button>
                    </div>
                    <p
                      id='visualizer-preset-name'
                      className={styles.presetName}
                      aria-live='polite'
                      translate='no'
                    >
                      {visualizerPresetName}
                    </p>
                  </div>
                )}

                <div className={styles.field}>
                  <label id='label-visualizer-sensitivity'>Sensitivity</label>
                  <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    value={sensitivity}
                    onChange={handleSensitivity}
                    className={styles.slider}
                    aria-labelledby='label-visualizer-sensitivity'
                  />
                </div>

                {showAudioResponse && (
                  <div className={styles.audioResponse}>
                    <div className={styles.audioResponseHeader}>
                      <label>Audio Response</label>
                      <Button onClick={handleResetAudioResponse}>Reset</Button>
                    </div>

                    <div className={styles.field}>
                      <label id='label-audio-gain'>Gain (post-FFT)</label>
                      <Slider
                        min={0.2}
                        max={3}
                        step={0.1}
                        value={audioResponse.globalGain}
                        onChange={(val: number) => handleAudioResponseField('globalGain', val)}
                        className={styles.slider}
                        aria-labelledby='label-audio-gain'
                      />
                      <p className={styles.hintText}>Scales frequency data after analysis</p>
                    </div>

                    <div className={styles.field}>
                      <label id='label-audio-bass'>Bass</label>
                      <Slider
                        min={0}
                        max={3}
                        step={0.1}
                        value={audioResponse.bassWeight}
                        onChange={(val: number) => handleAudioResponseField('bassWeight', val)}
                        className={styles.slider}
                        aria-labelledby='label-audio-bass'
                      />
                    </div>

                    <div className={styles.field}>
                      <label id='label-audio-mid'>Mid</label>
                      <Slider
                        min={0}
                        max={3}
                        step={0.1}
                        value={audioResponse.midWeight}
                        onChange={(val: number) => handleAudioResponseField('midWeight', val)}
                        className={styles.slider}
                        aria-labelledby='label-audio-mid'
                      />
                    </div>

                    <div className={styles.field}>
                      <label id='label-audio-treble'>Treble</label>
                      <Slider
                        min={0}
                        max={3}
                        step={0.1}
                        value={audioResponse.trebleWeight}
                        onChange={(val: number) => handleAudioResponseField('trebleWeight', val)}
                        className={styles.slider}
                        aria-labelledby='label-audio-treble'
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {isWebGLSupported && mediaType !== 'cdg' && !isVideoKeyingEnabled
              && <p className={styles.unsupported}>Not available for this media type</p>}

            {!isWebGLSupported
              && <p className={styles.unsupported}>WebGL not supported</p>}
          </fieldset>
        </div>

        <div className={clsx(styles.section, styles.lyrics)}>
          <fieldset>
            <legend>
              <label>Lyrics</label>
            </legend>

            {mediaType === 'cdg' && (
              <div className={styles.field}>
                <label id='label-lyrics-size'>Size</label>
                <Slider
                  min={0.4}
                  max={0.9}
                  step={0.01}
                  value={cdgSize}
                  onChange={handleSize}
                  className={styles.slider}
                  aria-labelledby='label-lyrics-size'
                />
              </div>
            )}

            {(mediaType === 'cdg' || isVideoKeyingEnabled) && (
              <div className={styles.field}>
                <label id='label-lyrics-background'>Background</label>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={mediaType === 'cdg' ? cdgAlpha : mp4Alpha}
                  onChange={handleAlpha}
                  className={styles.slider}
                  aria-labelledby='label-lyrics-background'
                />
              </div>
            )}

            {mediaType !== 'cdg' && !isVideoKeyingEnabled && (
              <p className={styles.unsupported}>No options available</p>
            )}
          </fieldset>
        </div>
      </div>
    </Modal>
  )
}

export default DisplayCtrl
