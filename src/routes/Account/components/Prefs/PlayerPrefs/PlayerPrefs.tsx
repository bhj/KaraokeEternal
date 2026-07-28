import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Accordion from 'components/Accordion/Accordion'
import Icon from 'components/Icon/Icon'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import { setPref } from 'store/modules/prefs'
import styles from './PlayerPrefs.css'

const PlayerPrefs = () => {
  const isReplayGainEnabled = useAppSelector(state => state.prefs.isReplayGainEnabled)
  const dispatch = useAppDispatch()

  const toggleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setPref({ key: e.currentTarget.name, data: e.currentTarget.checked }))
  }

  return (
    <Accordion
      className={styles.container}
      headingComponent={(
        <div className={styles.heading}>
          <Icon icon='TELEVISION_PLAY' size={32} className={styles.icon} />
          <div className={styles.title}>Player</div>
        </div>
      )}
    >
      <div className={styles.content}>
        <InputCheckbox
          label='ReplayGain (clip-safe)'
          checked={isReplayGainEnabled}
          onChange={toggleCheckbox}
          name='isReplayGainEnabled'
          aria-describedby='isReplayGainEnabled-desc'
        />
        <p id='isReplayGainEnabled-desc' className={styles.description}>
          Makes volume more consistent across songs. Media files without ReplayGain
          tags will be analyzed (slower to load) the first time they&apos;re played.
        </p>
      </div>
    </Accordion>
  )
}

export default PlayerPrefs
