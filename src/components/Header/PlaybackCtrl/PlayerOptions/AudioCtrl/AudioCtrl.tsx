import React from 'react'
import Button from 'components/Button/Button'
import Slider from 'components/Slider/Slider'
import useOptimisticValue from 'lib/useOptimisticValue'
import styles from './AudioCtrl.css'
import { MediaType, PITCH_SEMITONES_MAX, PITCH_SEMITONES_MIN, PlaybackOptions } from 'shared/types'

const formatPitch = (val: number) => val > 0 ? `+${val}` : `${val}`

// a saved 0 is worth naming: it's the file as-is, not a missing value
const formatSavedPitch = (val: number) => val === 0 ? 'Original' : formatPitch(val)

interface AudioCtrlProps {
  /** the media's saved pitch, which applies to every singer; 0 means none is saved */
  globalPitch: number
  isPitchSupported: boolean
  mediaType?: MediaType
  pitch: number
  /** the singer's saved preference for the media, if any */
  userPitch: number | null
  // actions
  onRequestOptions(opts: PlaybackOptions): void
  /** omitted when saving the global pitch isn't permitted */
  onSetGlobalPitch?(pitch: number): void
  /** omitted when the singer isn't this user; null clears their preference */
  onSetUserPitch?(pitch: number | null): void
}

const AudioCtrl = ({
  globalPitch,
  isPitchSupported,
  mediaType = '',
  pitch,
  userPitch,
  onRequestOptions,
  onSetGlobalPitch,
  onSetUserPitch,
}: AudioCtrlProps) => {
  // optimistic value, since the player-reported pitch is throttled
  const [displayPitch, setDisplayPitch] = useOptimisticValue(pitch)

  const handleChange = (val: number) => {
    setDisplayPitch(val)
    onRequestOptions({ pitch: val })
  }

  // the singer's preference follows the slider, saved on the settled value so a
  // drag doesn't write (and broadcast to the room) every semitone it passes over
  const handleChangeComplete = (val: number) => {
    if (val !== userPitch) onSetUserPitch?.(val)
  }

  // what governs once the global is gone, and so where clearing it lands playback
  const ungloballedPitch = userPitch ?? 0

  // dropping a preference that already matches the global is still worth doing:
  // it's what lets a later change to the global reach this singer
  const canClearUserPitch = !!onSetUserPitch && userPitch !== null

  // Reset: with no preference of their own the singer is back on the global value,
  // so apply it now instead of leaving playback on the pitch they just discarded
  const handleReset = () => {
    onSetUserPitch?.(null)
    handleChange(globalPitch)
  }

  // the other half of the same idea: dropping the global falls through to the
  // singer's own pitch, or the original where they have none
  const handleClearGlobalPitch = () => {
    onSetGlobalPitch?.(0)
    handleChange(ungloballedPitch)
  }

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
              onChangeComplete={handleChangeComplete}
              className={styles.slider}
              aria-labelledby='label-pitch'
              handleComponent={(
                <div className={styles.handleValue}>
                  {formatPitch(displayPitch)}
                </div>
              )}
            />
            {/* two things to undo, and either alone is reason enough to offer it:
                a preference to drop, or playback away from the global */}
            <Button
              variant='default'
              onClick={handleReset}
              disabled={!canClearUserPitch && displayPitch === globalPitch}
            >
              Reset
            </Button>

            {onSetGlobalPitch && (
              <dl className={styles.saved}>
                <dt>Global Pitch:</dt>
                {/* 0 is stored as "unset", so there's no absent state to show */}
                <dd className={styles.value}>
                  {formatSavedPitch(globalPitch)}
                </dd>
                <dd className={styles.actions}>
                  <Button
                    className={styles.link}
                    onClick={() => onSetGlobalPitch(displayPitch)}
                    disabled={displayPitch === globalPitch}
                    aria-label='Set global pitch'
                  >
                    Set
                  </Button>
                  {/* the server stores 0 as "unset", so clearing is setting 0 */}
                  <Button
                    className={styles.link}
                    onClick={handleClearGlobalPitch}
                    disabled={globalPitch === 0}
                    aria-label='Clear global pitch'
                  >
                    Clear
                  </Button>
                </dd>
              </dl>
            )}
          </>
        )}

        {isPitchSupported && !mediaType && (
          <p className={styles.unsupported}>Not available (no media)</p>
        )}

        {!isPitchSupported && (
          <p className={styles.unsupported}>
            Not available (Player requires a secure connection)
            <br />
            {/* @ts-expect-error: global via Webpack */}
            <a href={__KE_URL_PITCH_HELP__} target='_blank' rel='noreferrer'>
              How to enable
            </a>
          </p>
        )}
      </fieldset>
    </div>
  )
}

export default AudioCtrl
