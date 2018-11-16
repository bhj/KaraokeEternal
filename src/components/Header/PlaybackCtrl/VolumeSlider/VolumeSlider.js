/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import OptimisticSlider from 'components/OptimisticSlider'
import { Handle } from 'rc-slider'
import Icon from 'components/Icon'
import './VolumeSlider.css'
// depends on styles/global/rc-slider

export default class VolumeSlider extends React.Component {
  static propTypes = {
    volume: PropTypes.number.isRequired,
    onVolumeChange: PropTypes.func.isRequired,
  }

  render () {
    return (
      <OptimisticSlider
        min={0}
        max={1}
        step={0.01}
        value={this.props.volume}
        onChange={this.props.onVolumeChange}
        handle={handle}
        styleName='slider'
      />
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
