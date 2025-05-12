import React, { useCallback } from 'react'
import Accordion from 'components/Accordion/Accordion'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Icon from 'components/Icon/Icon'
import type { IRoomPrefs } from 'shared/types'
import styles from './UserPrefs.css'

interface UserPrefsProps {
  prefs: Partial<IRoomPrefs>
  onChange: (prefs: Partial<IRoomPrefs>) => void
}

const UserPrefs = ({ onChange, prefs = {} }: UserPrefsProps) => {
  const handleSetPref = useCallback((update: Partial<IRoomPrefs>) => {
    onChange({ ...prefs, ...update })
  }, [onChange, prefs])

  return (
    <Accordion
      headingComponent={(
        <div className={styles.heading}>
          <Icon icon='PERSON' />
          <div className={styles.title}>Users</div>
        </div>
      )}
    >
      <div className={styles.content}>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow new standard accounts'
            checked={prefs?.user?.isNewAllowed ?? false}
            onChange={checked => handleSetPref({ user: { ...prefs.user, isNewAllowed: checked } })}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow new guest accounts'
            checked={prefs?.user?.isGuestAllowed ?? false}
            onChange={checked => handleSetPref({ user: { ...prefs.user, isGuestAllowed: checked } })}
          />
        </div>
      </div>
    </Accordion>
  )
}

export default UserPrefs
