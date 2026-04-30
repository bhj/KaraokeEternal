import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { fetchUsers } from 'routes/Account/modules/users'
import Accordion from 'components/Accordion/Accordion'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Icon from 'components/Icon/Icon'
import styles from './ManagersPicker.css'

interface ManagersPickerProps {
  selected: number[]
  onChange: (next: number[]) => void
}

const ManagersPicker = ({ selected, onChange }: ManagersPickerProps) => {
  const dispatch = useAppDispatch()
  const users = useAppSelector(state => state.users)

  useEffect(() => {
    if (users && users.result.length === 0) {
      dispatch(fetchUsers())
    }
  }, [dispatch, users])

  const handleToggle = (userId: number, checked: boolean) => {
    if (checked) {
      if (!selected.includes(userId)) onChange([...selected, userId])
    } else {
      onChange(selected.filter(id => id !== userId))
    }
  }

  const candidates = users?.result.filter(uid => users.entities[uid].role === 'room_manager') ?? []

  return (
    <Accordion
      headingComponent={(
        <div className={styles.heading}>
          <Icon icon='PERSON' />
          <div>Room Managers</div>
        </div>
      )}
    >
      <div className={styles.content}>
        {candidates.length === 0
          ? (
              <div className={styles.empty}>
                No users with the &quot;Room Manager&quot; role yet. Assign the role from the Users panel.
              </div>
            )
          : (
              candidates.map((uid) => {
                const u = users.entities[uid]
                return (
                  <InputCheckbox
                    key={String(uid)}
                    label={u.name + (u.username ? ` (${u.username})` : '')}
                    name={`manager-${uid}`}
                    checked={selected.includes(uid)}
                    onChange={e => handleToggle(uid, e.target.checked)}
                  />
                )
              })
            )}
      </div>
    </Accordion>
  )
}

export default ManagersPicker
