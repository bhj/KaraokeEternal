import React from 'react'
import Slider from 'components/Slider/Slider'
import Icon from 'components/Icon/Icon'
import styles from './VolumeSlider.css'

interface VolumeSliderProps {
  volume: number
  onVolumeChange: (value: number) => void
}

interface HandleProps {
  'className'?: string
  'aria-label'?: string
}

// volume slider handle/grabber
const handle = (node: React.ReactElement<HandleProps>, { value }: { value: number }) => {
  let icon = 'VOLUME_UP'
  if (value === 0) icon = 'VOLUME_OFF'
  else if (value < 0.4) icon = 'VOLUME_MUTE'
  else if (value < 0.7) icon = 'VOLUME_DOWN'

  // rc-slider passes a node (div) to which we add style and children
  return React.cloneElement(node, {
    'aria-label': 'Volume',
    'className': styles.handle,
  }, (
    <Icon icon={icon} />
  ))
}

const VolumeSlider = ({ volume, onVolumeChange }: VolumeSliderProps) => {
  return (
    <Slider
      className={styles.slider}
      handle={handle}
      min={0}
      max={1}
      onChange={onVolumeChange}
      step={0.01}
      value={volume}
    />
  )
}

export default VolumeSlider
