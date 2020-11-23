import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'components/Icon'
import { setPref } from 'store/modules/prefs'
import './PlayerPrefs.css'

const PlayerPrefs = props => {
  const [isExpanded, setExpanded] = useState(false)
  const isReplayGainEnabled = useSelector(state => state.prefs.isReplayGainEnabled)
  const toggleExpanded = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded])

  const dispatch = useDispatch()
  const toggleCheckbox = useCallback((e) => {
    dispatch(setPref(e.target.name, e.target.checked))
  }, [dispatch])

  return (
    <div styleName='container'>
      <div styleName='heading' onClick={toggleExpanded}>
        <Icon icon='TELEVISION_PLAY' size={28} styleName='icon' />
        <div styleName='title'>Player</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} styleName='icon' />
        </div>
      </div>

      <div styleName='content' style={{ display: isExpanded ? 'block' : 'none' }}>
        <label>
          <input type='checkbox'
            checked={isReplayGainEnabled}
            onChange={toggleCheckbox}
            name='isReplayGainEnabled'
          /> ReplayGain (clip-safe)
        </label>
      </div>
    </div>
  )
}

export default PlayerPrefs
