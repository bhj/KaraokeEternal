import PropTypes from 'prop-types'
import React from 'react'
import { SkyLightStateless } from 'react-skylight'
import OptimisticSlider from 'components/OptimisticSlider'
import { Handle } from 'rc-slider'
import Icon from 'components/Icon'
import './VisualizerCtrl.css'

export default class VisualizerCtrl extends React.Component {
  static propTypes = {
    bgAlpha: PropTypes.number.isRequired,
    isVisible: PropTypes.bool.isRequired,
    // status
    isEnabled: PropTypes.bool.isRequired,
    isSupported: PropTypes.bool.isRequired,
    presetName: PropTypes.string.isRequired,
    sensitivity: PropTypes.number.isRequired,
    // actions
    onBackgroundAlphaChange: PropTypes.func.isRequired,
    onChangePreset: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  checkbox = React.createRef()

  handleToggleEnabled = () => {
    this.props.onChange({ isEnabled: !this.props.isEnabled })
  }

  handlePresetNext = () => { this.props.onChangePreset('next') }
  handlePresetPrev = () => { this.props.onChangePreset('prev') }
  handlePresetRand = () => { this.props.onChangePreset('rand') }

  handleChangeSensitivity = val => {
    this.props.onChange({ sensitivity: val })
  }

  handleBackgroundAlpha = val => {
    this.props.onBackgroundAlphaChange(val)
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
          // height: '85%',
          top: '5%',
          left: '5%',
          margin: 0,
          paddingLeft: '30px',
          paddingRight: '30px',
        }}
      >
        <div className='container'>
          <label>
            <input type='checkbox'
              checked={this.props.isEnabled}
              onChange={this.handleToggleEnabled}
              ref={this.checkbox}
            /> Visualizer
          </label>

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

          <label>{this.props.presetName}</label>

          <label styleName='field'>Sensitivity</label>
          <OptimisticSlider
            min={0}
            max={1}
            step={0.01}
            value={this.props.sensitivity}
            onChange={this.handleChangeSensitivity}
            handle={handle}
            styleName='slider'
          />
          <br/>

          <label styleName='field'>Lyrics Background</label>
          <OptimisticSlider
            min={0}
            max={1}
            step={0.01}
            value={this.props.bgAlpha}
            onChange={this.handleBackgroundAlpha}
            handle={handle}
            styleName='slider'
          />
          <br/>

          <div styleName='field'>
            <button styleName='btnDone' onClick={this.props.onClose}>
              Done
            </button>
          </div>
        </div>
      </SkyLightStateless>
    )
  }
}

// volume slider handle/grabber
const handle = (props) => {
  const { value, dragging, ...restProps } = props

  const style = Object.assign({ left: `${props.offset}%` }, {
    position: 'absolute',
    transform: 'translate(-50%, -42%)',
    touchAction: 'pan-x',
  })

  return (
    <div style={style}>
      <Icon icon='CIRCLE' size={36} styleName='handle' />
      <Handle {...restProps} />
    </div>
  )
}
