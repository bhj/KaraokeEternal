import React from 'react'
import { useAppSelector } from 'store/hooks'
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
  const roles = useAppSelector(state => state.prefs.roles)

  const getRoleId = (roleName: string) => {
    return roles.result.find(roleId => roles.entities[roleId].name === roleName)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    const roleId = getRoleId(name)
    if (!roleId) return

    onChange({
      ...prefs,
      roles: {
        ...prefs.roles,
        [roleId]: {
          ...prefs.roles?.[roleId],
          allowNew: checked,
        },
      },
    })
  }

  const allowNewGuest = prefs.roles?.[getRoleId('guest')]?.allowNew ?? false
  const allowNewStandard = prefs.roles?.[getRoleId('standard')]?.allowNew ?? false

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
            label='Allow new standard users'
            name='standard'
            checked={allowNewStandard}
            onChange={handleChange}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow new guests'
            name='guest'
            checked={allowNewGuest}
            onChange={handleChange}
          />
        </div>
      </div>
    </Accordion>
  )
}

export default UserPrefs
