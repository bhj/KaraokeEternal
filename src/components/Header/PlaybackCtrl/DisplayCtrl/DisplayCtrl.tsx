import React from 'react'
import clsx from 'clsx'
import Modal, { ModalProps } from 'components/Modal/Modal'
import Button from 'components/Button/Button'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Slider from 'components/Slider/Slider'
import Icon from 'components/Icon/Icon'
import styles from './DisplayCtrl.css'

interface DisplayCtrlProps {
  cdgAlpha: number
  cdgSize: number
  isVideoKeyingEnabled: boolean
  isVisualizerEnabled: boolean
  isWebGLSupported: boolean
  mediaType?: string
  mp4Alpha: number
  sensitivity: number
  visualizerPresetName: string
  // actions
  onRequestOptions(...args: unknown[]): unknown
  onClose: ModalProps['onClose']
}

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
  onRequestOptions,
  onClose,
}: DisplayCtrlProps) => {
  const handleAlpha = (val: number) => {
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

  const handlePresetNext = () => onRequestOptions({
    visualizer: { nextPreset: true },
  })

  const handlePresetPrev = () => onRequestOptions({
    visualizer: { prevPreset: true },
  })

  const handlePresetRandom = () => onRequestOptions({
    visualizer: { randomPreset: true },
  })

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
                  >
                    {visualizerPresetName}
                  </p>
                </div>

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
                  min={0.6}
                  max={1}
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
