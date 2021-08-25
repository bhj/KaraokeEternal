import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Icon from 'components/Icon'
import { setPref } from 'store/modules/prefs'
import styles from './AccountPrefs.css'

const AccountPrefs = props => {
  const [isExpanded, setExpanded] = useState(false)
  const isUsernameRequired = useSelector(state => state.prefs.isUsernameRequired)
  const isPasswordRequired = useSelector(state => state.prefs.isPasswordRequired)
  const toggleExpanded = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded])

  const dispatch = useDispatch()
  const toggleCheckbox = useCallback((e) => {
    dispatch(setPref(e.target.name, e.target.checked))
  }, [dispatch])

  return (
    <div className={styles.container}>
      <div className={styles.heading} onClick={toggleExpanded}>
        <Icon icon='ACCOUNT' size={28} className={styles.icon} />
        <div className={styles.title}>New Accounts</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} className={styles.icon} />
        </div>
      </div>

      <div className={styles.content} style={{ display: isExpanded ? 'block' : 'none' }}>
        <label>
          <input type='checkbox'
            checked={isUsernameRequired}
            onChange={toggleCheckbox}
            name='isUsernameRequired'
          /> Require username or email address
        </label>
      </div>
      <div className={styles.content} style={{ display: isExpanded ? 'block' : 'none' }}>
        <label>
          <input type='checkbox'
            checked={isPasswordRequired}
            onChange={toggleCheckbox}
            name='isPasswordRequired'
          /> Require password (non-admins)
        </label>
      </div>
    </div>
  )
}

export default AccountPrefs
