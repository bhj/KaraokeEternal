import React from 'react'
import OptimisticSlider from 'components/OptimisticSlider/OptimisticSlider'
import Icon from 'components/Icon/Icon'
import styles from './VolumeSlider.css'

interface VolumeSliderProps {
  volume: number
  onVolumeChange(...args: unknown[]): unknown
}

// depends on styles/global/rc-slider

export default class VolumeSlider extends React.Component<VolumeSliderProps> {
  render () {
    return (
      <OptimisticSlider
        className={styles.slider}
        handle={handle}
        min={0}
        max={1}
        onChange={this.props.onVolumeChange}
        step={0.01}
        value={this.props.volume}
      />
    )
  }
}

// volume slider handle/grabber
const handle = (node, { value }) => {
  let icon = 'VOLUME_UP'
  if (value === 0) icon = 'VOLUME_OFF'
  else if (value < 0.4) icon = 'VOLUME_MUTE'
  else if (value < 0.7) icon = 'VOLUME_DOWN'

  // rc-slider passes a node (div) to which we add style and children
  return React.cloneElement(node, { className: styles.handle }, (
    <Icon icon={icon} size={42} />
  ))
}
