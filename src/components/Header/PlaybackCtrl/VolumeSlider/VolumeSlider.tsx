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
  const icon = (() => {
    if (value === 0) return 'VOLUME_OFF'
    if (value < 0.4) return 'VOLUME_MUTE'
    if (value < 0.7) return 'VOLUME_DOWN'
    return 'VOLUME_UP'
  })()

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
