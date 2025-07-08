import React, { useRef } from 'react'
import clsx from 'clsx'
import InputRadio from 'components/InputRadio/InputRadio'
import styles from './SelectRoom.css'
import type { Room } from 'shared/types'

interface SelectRoomProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  className?: string
  rooms: {
    result: number[]
    entities: Record<number, Room>
  }
  roomId: number | null
  roomPassword: string
  showAllRooms: boolean
  onRoomSelect: (value: number) => void
  onRoomPasswordChange: (value: string) => void
}

const SelectRoom = ({
  onRoomSelect: onRoomIdChange,
  onRoomPasswordChange,
  className,
  rooms,
  roomId,
  roomPassword,
  showAllRooms,
}: SelectRoomProps) => {
  const roomPasswordRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const setPasswordRef = (roomId: number) => (el: HTMLInputElement | null) => {
    roomPasswordRefs.current[roomId] = el
  }

  const handleRoomChange = (value: string) => {
    const selectedRoomId = value

    Object.entries(roomPasswordRefs.current).forEach(([id, ref]) => {
      if (ref) {
        if (id === selectedRoomId) {
          ref.classList.remove(styles.hidden)
          ref.focus()
        } else {
          ref.classList.add(styles.hidden)
        }
      }
    })

    onRoomIdChange(parseInt(selectedRoomId))
  }

  return (
    <div className={clsx(styles.container, className)}>
      {rooms.result.map((id) => {
        if (!showAllRooms && id !== roomId) return null

        return (
          <div key={`room-${id}`}>
            <InputRadio
              name='roomId'
              className={clsx(styles.option, id === roomId && styles.checked)}
              label={rooms.entities[id].name}
              value={id}
              onChange={handleRoomChange}
              checked={id === roomId}
            />

            {rooms.entities[id]?.hasPassword && (
              <input
                type='password'
                autoComplete='off'
                className={clsx((roomId === null || id !== roomId) && styles.hidden)}
                onChange={(e) => { onRoomPasswordChange(e.target.value) }}
                placeholder='room password (required)'
                aria-label='room password (required)'
                ref={setPasswordRef(id)}
                value={roomPassword}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SelectRoom
