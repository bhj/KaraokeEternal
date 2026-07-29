import React from 'react'
import Button from 'components/Button/Button'
import Slider from 'components/Slider/Slider'
import useOptimisticValue from 'lib/useOptimisticValue'
import styles from './AudioCtrl.css'
import { MediaType, PITCH_SEMITONES_MAX, PITCH_SEMITONES_MIN, PlaybackOptions } from 'shared/types'

interface AudioCtrlProps {
  defaultPitch: number
  isPitchSupported: boolean
  mediaType?: MediaType
  pitch: number
  // actions
  onRequestOptions(opts: PlaybackOptions): void
  /** omitted when saving a default isn't permitted */
  onSetDefaultPitch?(pitch: number): void
}

const AudioCtrl = ({
  defaultPitch,
  isPitchSupported,
  mediaType = '',
  pitch,
  onRequestOptions,
  onSetDefaultPitch,
}: AudioCtrlProps) => {
  // optimistic value, since the player-reported pitch is throttled
  const [displayPitch, setDisplayPitch] = useOptimisticValue(pitch)

  const handleChange = (val: number) => {
    setDisplayPitch(val)
    onRequestOptions({ pitch: val })
  }

  const handleReset = () => handleChange(0)

  return (
    <div>
      <fieldset>
        <legend>
          <label id='label-pitch'>Pitch (semitones)</label>
        </legend>

        {isPitchSupported && mediaType && (
          <>
            <Slider
              min={PITCH_SEMITONES_MIN}
              max={PITCH_SEMITONES_MAX}
              step={1}
              startPoint={0}
              value={displayPitch}
              onChange={handleChange}
              className={styles.slider}
              aria-labelledby='label-pitch'
              handleComponent={(
                <div className={styles.handleValue}>
                  {displayPitch > 0 ? `+${displayPitch}` : displayPitch}
                </div>
              )}
            />
            <div className={styles.buttons}>
              <Button
                variant='default'
                onClick={handleReset}
                disabled={displayPitch === 0}
              >
                Reset
              </Button>

              {onSetDefaultPitch && (
                <Button
                  variant='default'
                  onClick={() => onSetDefaultPitch(displayPitch)}
                  disabled={displayPitch === defaultPitch}
                >
                  Set as Default
                </Button>
              )}
            </div>
          </>
        )}

        {isPitchSupported && !mediaType && (
          <p className={styles.unsupported}>Not available (no media)</p>
        )}

        {!isPitchSupported && (
          <p className={styles.unsupported}>Not available (Player requires a secure connection)</p>
        )}
      </fieldset>
    </div>
  )
}

export default AudioCtrl
