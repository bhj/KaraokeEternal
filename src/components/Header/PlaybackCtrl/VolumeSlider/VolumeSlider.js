import React from 'react'
import PropTypes from 'prop-types'
import OptimisticSlider from 'components/OptimisticSlider'
import Icon from 'components/Icon'
import styles from './VolumeSlider.css'
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
        className={styles.slider}
      />
    )
  }
}

// volume slider handle/grabber
const handle = (props) => {
  const { value } = props // eslint-disable-line react/prop-types

  let icon = 'VOLUME_UP'
  if (value === 0) icon = 'VOLUME_OFF'
  else if (value < 0.4) icon = 'VOLUME_MUTE'
  else if (value < 0.7) icon = 'VOLUME_DOWN'

  return (
    <Icon icon={icon} size={42} className={styles.handle} style={{
      left: `calc(${props.offset}% - 18px)`, // eslint-disable-line react/prop-types
    }}/>
  )
}
