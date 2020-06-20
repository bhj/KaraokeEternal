import PropTypes from 'prop-types'
import React from 'react'
import Modal from 'components/Modal'
import OptimisticSlider from 'components/OptimisticSlider'
import Icon from 'components/Icon'
import './DisplayCtrl.css'

export default class DisplayCtrl extends React.Component {
  static propTypes = {
    cdgAlpha: PropTypes.number.isRequired,
    cdgSize: PropTypes.number.isRequired,
    isAlphaSupported: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    isVisualizerEnabled: PropTypes.bool.isRequired,
    isVisualizerSupported: PropTypes.bool.isRequired,
    sensitivity: PropTypes.number.isRequired,
    visualizerPresetName: PropTypes.string.isRequired,
    ui: PropTypes.object.isRequired,
    // actions
    onRequestOptions: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  checkbox = React.createRef()

  handleAlpha = val => {
    this.props.onRequestOptions({ cdgAlpha: val })
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

  handlePresetNext = () => this.props.onRequestOptions({
    visualizer: { nextPreset: true }
  })

  handlePresetPrev = () => this.props.onRequestOptions({
    visualizer: { prevPreset: true }
  })

  handlePresetRandom = () => this.props.onRequestOptions({
    visualizer: { randomPreset: true }
  })

  render () {
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
        <div className='container'>
          <fieldset styleName='visualizer'>
            <legend>
              <label>
                <input type='checkbox'
                  checked={this.props.isVisualizerEnabled}
                  disabled={!this.props.isVisualizerSupported}
                  onChange={this.handleToggleVisualizer}
                  ref={this.checkbox}
                /> Visualizer
              </label>
            </legend>

            {this.props.isVisualizerSupported &&
            <>
              <div styleName='presetBtnContainer'>
                <button styleName='btnPreset' onClick={this.handlePresetPrev}>
                  <Icon icon='CHEVRON_LEFT' size={42} styleName='btnIcon' />
                </button>
                <button styleName='btnPreset' onClick={this.handlePresetRandom}>
                  <Icon icon='DICE' size={48} styleName='btnIcon' />
                </button>
                <button styleName='btnPreset' onClick={this.handlePresetNext}>
                  <Icon icon='CHEVRON_RIGHT' size={42} styleName='btnIcon' />
                </button>
              </div>
              <label>{this.props.visualizerPresetName}</label>

              <label styleName='field'>Sensitivity</label>
              <OptimisticSlider
                min={0}
                max={2}
                step={0.01}
                value={this.props.sensitivity}
                onChange={this.handleSensitivity}
                handle={handle}
                styleName='slider'
              />
            </>
            }

            {!this.props.isVisualizerSupported &&
              <p styleName='unsupported'>WebGL support not detected</p>
            }
          </fieldset>

          <fieldset styleName='lyrics'>
            <legend>
              <label>Lyrics</label>
            </legend>

            <label styleName='field'>Size</label>
            <OptimisticSlider
              min={0.4}
              max={1}
              step={0.01}
              value={this.props.cdgSize}
              onChange={this.handleSize}
              handle={handle}
              styleName='slider'
            />

            <label styleName='field'>Background</label>
            <OptimisticSlider
              min={0}
              max={1}
              step={0.01}
              value={this.props.cdgAlpha}
              onChange={this.handleAlpha}
              handle={handle}
              styleName='slider'
            />
          </fieldset>
        </div>
      </Modal>
    )
  }
}

// slider handle/grabber
const handle = (props) => (
  <Icon icon='CIRCLE' size={36} styleName='handle' style={{
    left: `calc(${props.offset}% - 18px)`, // eslint-disable-line react/prop-types
  }}/>
)
