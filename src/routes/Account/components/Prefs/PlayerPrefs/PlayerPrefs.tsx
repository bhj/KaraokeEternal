import React, { useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Icon from 'components/Icon/Icon'
import { setPref } from 'store/modules/prefs'
import styles from './PlayerPrefs.css'

const PlayerPrefs = () => {
  const [isExpanded, setExpanded] = useState(false)
  const isReplayGainEnabled = useAppSelector(state => state.prefs.isReplayGainEnabled)
  const toggleExpanded = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded])

  const dispatch = useAppDispatch()
  const toggleCheckbox = useCallback((e) => {
    dispatch(setPref({ key: e.target.name, data: e.target.checked }))
  }, [dispatch])

  return (
    <div className={styles.container}>
      <div className={styles.heading} onClick={toggleExpanded}>
        <Icon icon='TELEVISION_PLAY' size={28} className={styles.icon} />
        <div className={styles.title}>Player</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} className={styles.icon} />
        </div>
      </div>

      <div className={styles.content} style={{ display: isExpanded ? 'block' : 'none' }}>
        <label>
          <input
            type='checkbox'
            checked={isReplayGainEnabled}
            onChange={toggleCheckbox}
            name='isReplayGainEnabled'
          />
          {' '}
          ReplayGain (clip-safe)
        </label>
      </div>
    </div>
  )
}

export default PlayerPrefs
