import React, { useCallback } from 'react'
import { useAppSelector } from 'store/hooks'
import Accordion from 'components/Accordion/Accordion'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Icon from 'components/Icon/Icon'
import type { IRoomPrefs } from 'shared/types'
import { resolveRoomAccessPrefs } from 'shared/roomAccess'
import styles from './UserPrefs.css'

interface UserPrefsProps {
  prefs: Partial<IRoomPrefs>
  onChange: (prefs: Partial<IRoomPrefs>) => void
}

const UserPrefs = ({ onChange, prefs = {} }: UserPrefsProps) => {
  const roles = useAppSelector(state => state.prefs.roles)

  const getRoleId = useCallback((roleName: string) => {
    return roles.result.find(roleId => roles.entities[roleId].name === roleName)
  }, [roles.entities, roles.result])

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [getRoleId, onChange, prefs])

  const handleAccessToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    const nextPrefs: Partial<IRoomPrefs> = { ...prefs }

    if (name === 'allowGuestOrchestrator') {
      nextPrefs.allowGuestOrchestrator = checked
    } else if (name === 'allowGuestCameraRelay') {
      nextPrefs.allowGuestCameraRelay = checked
    } else if (name === 'allowRoomCollaboratorsToSendVisualizer') {
      nextPrefs.allowRoomCollaboratorsToSendVisualizer = checked
    } else {
      return
    }

    onChange(nextPrefs)
  }, [onChange, prefs])

  const allowNewGuest = prefs.roles?.[getRoleId('guest')]?.allowNew ?? false
  const allowNewStandard = prefs.roles?.[getRoleId('standard')]?.allowNew ?? false
  const accessPrefs = resolveRoomAccessPrefs(prefs)

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
            onChange={handleRoleChange}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow new guests'
            name='guest'
            checked={allowNewGuest}
            onChange={handleRoleChange}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow guest orchestrator'
            name='allowGuestOrchestrator'
            checked={accessPrefs.allowGuestOrchestrator}
            onChange={handleAccessToggle}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow guest camera relay'
            name='allowGuestCameraRelay'
            checked={accessPrefs.allowGuestCameraRelay}
            onChange={handleAccessToggle}
          />
        </div>
        <div className={styles.field}>
          <InputCheckbox
            label='Allow collaborators to send visuals'
            name='allowRoomCollaboratorsToSendVisualizer'
            checked={accessPrefs.allowRoomCollaboratorsToSendVisualizer}
            onChange={handleAccessToggle}
          />
        </div>
      </div>
    </Accordion>
  )
}

export default UserPrefs
