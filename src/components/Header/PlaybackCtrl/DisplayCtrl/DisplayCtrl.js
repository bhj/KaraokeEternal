import PropTypes from 'prop-types'
import React from 'react'
import { SkyLightStateless } from 'react-skylight'
import OptimisticSlider from 'components/OptimisticSlider'
import Icon from 'components/Icon'
import './DisplayCtrl.css'

export default class DisplayCtrl extends React.Component {
  static propTypes = {
    alpha: PropTypes.number.isRequired,
    isAlphaSupported: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    isVisualizerEnabled: PropTypes.bool.isRequired,
    isVisualizerSupported: PropTypes.bool.isRequired,
    visualizerPresetName: PropTypes.string.isRequired,
    visualizerSensitivity: PropTypes.number.isRequired,
    // actions
    onAlphaChange: PropTypes.func.isRequired,
    onChangePreset: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  checkbox = React.createRef()

  handleToggleVisualizer = () => {
    this.props.onChange({ isEnabled: !this.props.isVisualizerEnabled })
  }

  handlePresetNext = () => { this.props.onChangePreset('next') }
  handlePresetPrev = () => { this.props.onChangePreset('prev') }
  handlePresetRand = () => { this.props.onChangePreset('rand') }

  handleChangeSensitivity = val => {
    this.props.onChange({ sensitivity: val })
  }

  handleAlpha = val => {
    this.props.onAlphaChange(val)
  }

  render () {
    return (
      <SkyLightStateless
        isVisible={this.props.isVisible}
        onCloseClicked={this.props.onClose}
        onOverlayClicked={this.props.onClose}
        title='Display'
        dialogStyles={{
          width: '90%',
          top: '5%',
          left: '5%',
          margin: 0,
          paddingLeft: '15px',
          paddingRight: '15px',
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
                <button styleName='btnPreset' onClick={this.handlePresetRand}>
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
                max={1}
                step={0.01}
                value={this.props.visualizerSensitivity}
                onChange={this.handleChangeSensitivity}
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

            <label styleName='field'>Background</label>
            <OptimisticSlider
              min={0}
              max={1}
              step={0.01}
              value={this.props.alpha}
              onChange={this.handleAlpha}
              handle={handle}
              styleName='slider'
            />
          </fieldset>

          <div styleName='field'>
            <button onClick={this.props.onClose}>
              Done
            </button>
          </div>
        </div>
      </SkyLightStateless>
    )
  }
}

// slider handle/grabber
const handle = (props) => (
  <Icon icon='CIRCLE' size={36} styleName='handle' style={{
    left: `calc(${props.offset}% - 18px)`, // eslint-disable-line react/prop-types
  }}/>
)
