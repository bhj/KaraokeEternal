import React from 'react'
import Slider from 'components/Slider/Slider'
import Icon from 'components/Icon/Icon'
import useOptimisticValue from 'lib/useOptimisticValue'
import styles from './VolumeSlider.css'

interface VolumeSliderProps {
  volume: number
  onVolumeChange: (value: number) => void
}

const VolumeSlider = ({ volume, onVolumeChange }: VolumeSliderProps) => {
  // optimistic value, since the player-reported volume is throttled
  const [displayVolume, setDisplayVolume] = useOptimisticValue(volume)

  const handleChange = (val: number) => {
    setDisplayVolume(val)
    onVolumeChange(val)
  }

  const icon = (() => {
    if (displayVolume === 0) return 'VOLUME_OFF'
    if (displayVolume < 0.4) return 'VOLUME_MUTE'
    if (displayVolume < 0.7) return 'VOLUME_DOWN'
    return 'VOLUME_UP'
  })()

  return (
    <div className={styles.container}>
      <Slider
        aria-label='Volume'
        className={styles.slider}
        handleComponent={<Icon icon={icon} className={styles.handleIcon} />}
        min={0}
        max={1}
        onChange={handleChange}
        step={0.01}
        value={displayVolume}
      />
    </div>
  )
}

export default VolumeSlider
