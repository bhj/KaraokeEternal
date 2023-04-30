import PropTypes from 'prop-types'
import React from 'react'
import Modal from 'components/Modal'
import OptimisticSlider from 'components/OptimisticSlider'
import Icon from 'components/Icon'
import styles from './DisplayCtrl.css'

export default class DisplayCtrl extends React.Component {
  static propTypes = {
    cdgAlpha: PropTypes.number.isRequired,
    cdgSize: PropTypes.number.isRequired,
    isVisible: PropTypes.bool.isRequired,
    isVisualizerEnabled: PropTypes.bool.isRequired,
    isRemoteControlQREnabled: PropTypes.bool.isRequired,
    isRemoteControlQRAlternateEnabled: PropTypes.bool.isRequired,
    isWebGLSupported: PropTypes.bool.isRequired,
    mediaType: PropTypes.string,
    mp4Alpha: PropTypes.number.isRequired,
    sensitivity: PropTypes.number.isRequired,
    visualizerPresetName: PropTypes.string.isRequired,
    ui: PropTypes.object.isRequired,
    // actions
    onRequestOptions: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isRemoteControlQREnabledAllowed: PropTypes.bool.isRequired,
  }

  checkbox = React.createRef()

  handleAlpha = val => {
    this.props.onRequestOptions({ [this.props.mediaType + 'Alpha']: val })
  }

  handleSensitivity = val => this.props.onRequestOptions({
    visualizer: { sensitivity: val }
  })

  handleSize = val => {
    this.props.onRequestOptions({ cdgSize: val })
  }

  handleToggleVisualizer = () => this.props.onRequestOptions({
    visualizer: { isEnabled: !this.props.isVisualizerEnabled }
  })

  handleToggleRemoteControlQR = () => this.props.onRequestOptions({
    remoteControlQR: { isEnabled: !this.props.isRemoteControlQREnabled }
  })

  handleToggleRemoteControlQRAlternate = () => this.props.onRequestOptions({
    remoteControlQR: { alternate: !this.props.isRemoteControlQRAlternateEnabled }
  })

  handleRemoteControlTranslucency = val => this.props.onRequestOptions({
    remoteControlQR: { opacity: val }
  })

  handleRemoteControlSize = val => this.props.onRequestOptions({
    remoteControlQR: { size: val }
  })



  handlePresetNext = () => this.props.onRequestOptions({
    visualizer: { nextPreset: true }
  })

  handlePresetPrev = () => this.props.onRequestOptions({
    visualizer: { prevPreset: true }
  })

  handlePresetRandom = () => this.props.onRequestOptions({
    visualizer: { randomPreset: true }
  })

  render() {
    return (
      <Modal
        isVisible={this.props.isVisible}
        onClose={this.props.onClose}
        title='Display'
        buttons=<button onClick={this.props.onClose}>Done</button>
        style={{
          width: Math.max(320, this.props.ui.contentWidth * 0.66),
        }}
      >
        <div className={styles.container}>
          <fieldset className={styles.visualizer}>
            <legend>
              <label>
                <input type='checkbox'
                  checked={this.props.isVisualizerEnabled}
                  disabled={!this.props.isWebGLSupported}
                  onChange={this.handleToggleVisualizer}
                  ref={this.checkbox}
                /> Visualizer
              </label>
            </legend>

            {this.props.isWebGLSupported && this.props.mediaType === 'cdg' &&
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
            }

            {this.props.isWebGLSupported && this.props.mediaType !== 'cdg' &&
              <p className={styles.unsupported}>Not available for this media type</p>
            }

            {!this.props.isWebGLSupported &&
              <p className={styles.unsupported}>WebGL not supported</p>
            }
          </fieldset>

          <fieldset className={styles.lyrics}>
            <legend>
              <label>Lyrics</label>
            </legend>

            {this.props.mediaType === 'cdg' &&
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
            }

            {this.props.mediaType !== 'cdg' &&
              <p className={styles.unsupported}>No options available</p>
            }
          </fieldset>

          {this.props.isRemoteControlQREnabledAllowed &&
            <>
              <fieldset className={styles.remoteControlQR}>
                <legend>
                  <label>
                    <input type='checkbox'
                      checked={this.props.isRemoteControlQREnabled}
                      onChange={this.handleToggleRemoteControlQR}
                      ref={this.checkbox}
                    /> Remote Control QR
                  </label>
                </legend>
                {this.props.isRemoteControlQREnabled &&
                  <>
                    <label>
                      <input type='checkbox'
                        checked={this.props.isRemoteControlQRAlternateEnabled}
                        onChange={this.handleToggleRemoteControlQRAlternate}
                        ref={this.checkbox}
                      /> Alternate Position (Prevents Burn-in)
                    </label>

                    <label className={styles.field}>Translucency</label>
                    <OptimisticSlider
                      min={0}
                      max={1}
                      step={0.01}
                      value={this.props.remoteControlTranslucency}
                      onChange={this.handleRemoteControlTranslucency}
                      handle={handle}
                      className={styles.slider}
                    />
                    <label className={styles.field}>Size</label>
                    <OptimisticSlider
                      min={0.05}
                      max={0.25}
                      step={0.01}
                      value={this.props.remoteControlSize}
                      onChange={this.handleRemoteControlSize}
                      handle={handle}
                      className={styles.slider}
                    />
                  </>
                }
                {!this.props.isRemoteControlQREnabled &&
                  <p className={styles.unsupported}>Enable to view options</p>
                }
              </fieldset>
            </>
          }
        </div>
      </Modal>
    )
  }
}

// slider handle/grabber
const handle = (node, props) => {
  // rc-slider passes a node (div) to which we add style and children
  return React.cloneElement(node, { className: styles.handle }, (
    <Icon icon={'CIRCLE'} size={36} />
  ))
}
