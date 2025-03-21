import React from 'react'
import { RootState } from 'store/store'
import Modal, { ModalProps } from 'components/Modal/Modal'
import OptimisticSlider from 'components/OptimisticSlider/OptimisticSlider'
import Icon from 'components/Icon/Icon'
import styles from './DisplayCtrl.css'

interface DisplayCtrlProps {
  cdgAlpha: number
  cdgSize: number
  isVisible: boolean
  isVisualizerEnabled: boolean
  isWebGLSupported: boolean
  mediaType?: string
  mp4Alpha: number
  sensitivity: number
  visualizerPresetName: string
  ui: RootState['ui']
  // actions
  onRequestOptions(...args: unknown[]): unknown
  onClose: ModalProps['onClose']
}

export default class DisplayCtrl extends React.Component<DisplayCtrlProps> {
  checkbox = React.createRef<HTMLInputElement>()

  handleAlpha = (val) => {
    this.props.onRequestOptions({ [this.props.mediaType + 'Alpha']: val })
  }

  handleSensitivity = val => this.props.onRequestOptions({
    visualizer: { sensitivity: val },
  })

  handleSize = (val) => {
    this.props.onRequestOptions({ cdgSize: val })
  }

  handleToggleVisualizer = () => this.props.onRequestOptions({
    visualizer: { isEnabled: !this.props.isVisualizerEnabled },
  })

  handlePresetNext = () => this.props.onRequestOptions({
    visualizer: { nextPreset: true },
  })

  handlePresetPrev = () => this.props.onRequestOptions({
    visualizer: { prevPreset: true },
  })

  handlePresetRandom = () => this.props.onRequestOptions({
    visualizer: { randomPreset: true },
  })

  render () {
    return (
      <Modal
        visible={this.props.isVisible}
        onClose={this.props.onClose}
        title='Display'
        buttons={<button onClick={this.props.onClose}>Done</button>}
        // style={{
        //   width: Math.max(320, this.props.ui.contentWidth * 0.66),
        // }}
      >
        <div>
          <fieldset className={styles.visualizer}>
            <legend>
              <label>
                <input
                  type='checkbox'
                  checked={this.props.isVisualizerEnabled}
                  disabled={!this.props.isWebGLSupported}
                  onChange={this.handleToggleVisualizer}
                  ref={this.checkbox}
                />
                {' '}
                Visualizer
              </label>
            </legend>

            {this.props.isWebGLSupported && this.props.mediaType === 'cdg' && (
              <>
                <div className={styles.presetBtnContainer}>
                  <button className={styles.btnPreset} onClick={this.handlePresetPrev}>
                    <Icon icon='CHEVRON_LEFT' size={42} className={styles.btnIcon} />
                  </button>
                  <button className={styles.btnPreset} onClick={this.handlePresetRandom}>
                    <Icon icon='DICE' size={48} className={styles.btnIcon} />
                  </button>
                  <button className={styles.btnPreset} onClick={this.handlePresetNext}>
                    <Icon icon='CHEVRON_RIGHT' size={42} className={styles.btnIcon} />
                  </button>
                </div>
                <label>{this.props.visualizerPresetName}</label>

                <label className={styles.field}>Sensitivity</label>
                <OptimisticSlider
                  min={0}
                  max={2}
                  step={0.01}
                  value={this.props.sensitivity}
                  onChange={this.handleSensitivity}
                  handle={handle}
                  className={styles.slider}
                />
              </>
            )}

            {this.props.isWebGLSupported && this.props.mediaType !== 'cdg'
            && <p className={styles.unsupported}>Not available for this media type</p>}

            {!this.props.isWebGLSupported
            && <p className={styles.unsupported}>WebGL not supported</p>}
          </fieldset>

          <fieldset className={styles.lyrics}>
            <legend>
              <label>Lyrics</label>
            </legend>

            {this.props.mediaType === 'cdg'
            && (
              <>
                <label className={styles.field}>Size</label>
                <OptimisticSlider
                  min={0.6}
                  max={1}
                  step={0.01}
                  value={this.props.cdgSize}
                  onChange={this.handleSize}
                  handle={handle}
                  className={styles.slider}
                />

                <label className={styles.field}>Background</label>
                <OptimisticSlider
                  min={0}
                  max={1}
                  step={0.01}
                  value={this.props[this.props.mediaType + 'Alpha']}
                  onChange={this.handleAlpha}
                  handle={handle}
                  className={styles.slider}
                />
              </>
            )}

            {this.props.mediaType !== 'cdg' && <p className={styles.unsupported}>No options available</p>}
          </fieldset>
        </div>
      </Modal>
    )
  }
}

// slider handle/grabber
const handle = (node) => {
  // rc-slider passes a node (div) to which we add style and children
  return React.cloneElement(node, { className: styles.handle }, (
    <Icon icon='CIRCLE' size={36} />
  ))
}
