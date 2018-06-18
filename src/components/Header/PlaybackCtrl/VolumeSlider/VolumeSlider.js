/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import Slider, { Handle } from 'rc-slider'
import Icon from 'components/Icon'
import BodyLock from 'components/BodyLock'
import './VolumeSlider.css'
// depends on styles/global/rc-slider

export default class VolumeSlider extends React.Component {
  static propTypes = {
    volume: PropTypes.number.isRequired,
    onVolumeChange: PropTypes.func.isRequired,
  }

  state = {
    vol: this.props.volume,
    isDragging: false,
  }

  handleChange = (vol) => {
    this.setState({
      vol,
      isDragging: true,
    })
    this.props.onVolumeChange(vol)
    this.ignoreStatus = false
  }

  handleAfterChange = (vol) => {
    this.setState({
      vol,
      isDragging: false,
    })
    this.props.onVolumeChange(vol)
    this.ignoreStatus = true
  }

  componentDidUpdate (prevProps) {
    if (this.ignoreStatus && prevProps.volume !== this.props.volume) {
      this.ignoreStatus = false
    }
  }

  render () {
    return (
    <>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={this.state.isDragging || this.ignoreStatus ? this.state.vol : this.props.volume}
        onChange={this.handleChange}
        onAfterChange={this.handleAfterChange}
        handle={handle}
        styleName='slider'
      />
      <BodyLock lock={this.state.isDragging} />
    </>
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

  let icon = 'VOLUME_UP'
  if (value === 0) icon = 'VOLUME_OFF'
  else if (value < 0.4) icon = 'VOLUME_MUTE'
  else if (value < 0.7) icon = 'VOLUME_DOWN'

  return (
    <div style={style}>
      <Icon icon={icon} size={42} styleName='icon' />
      <Handle {...restProps} />
    </div>
  )
}
