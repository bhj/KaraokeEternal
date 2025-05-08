import React, { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { fetchRooms } from 'store/modules/rooms'
import styles from './RoomSelect.css'

interface RoomSelectProps {
  className?: string
  onChange: ({ roomId, roomPassword }: { roomId: string, roomPassword: string }) => void
}

const RoomSelect = ({ className, onChange }: RoomSelectProps) => {
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [roomId, setRoomId] = useState('')
  const [roomPassword, setRoomPassword] = useState('')
  const [showRoomSelect, setShowRoomSelect] = useState(false)
  const [showRoomPassword, setShowRoomPassword] = useState(false)

  const rooms = useAppSelector(state => state.rooms)
  const location = useLocation()
  const dispatch = useAppDispatch()

  const handleRoomIdChange = useCallback(
    (roomId: string) => {
      setRoomId(roomId)
      onChange({ roomId, roomPassword })
    }, [onChange, roomPassword],
  )

  const handleRoomPasswordChange = useCallback(
    (roomPassword: string) => {
      setRoomPassword(roomPassword)
      onChange({ roomId, roomPassword })
    }, [onChange, roomId],
  )

  // once per mount
  useEffect(() => {
    dispatch(fetchRooms())
  }, [dispatch])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const id = searchParams.get('roomId')
    const password = searchParams.get('password')

    if (id && rooms.entities[id]) {
      handleRoomIdChange(id)
      setShowRoomSelect(false)

      if (rooms.entities[id]?.hasPassword) {
        if (password) {
          handleRoomPasswordChange(atob(password))
          setShowRoomPassword(false)
        } else {
          setShowRoomPassword(true)
        }
      }
    } else if (rooms.result.length === 1) {
      handleRoomIdChange(String(rooms.result[0]))
      setShowRoomSelect(false)
    } else {
      setShowRoomSelect(true)
      setShowRoomPassword(true)
    }
  }, [handleRoomIdChange, handleRoomPasswordChange, location.search, rooms])

  // focus room password when a room is manually selected
  useEffect(() => {
    if (rooms.result.length > 1 && roomId && rooms.entities[roomId]?.hasPassword) {
      passwordRef.current?.focus()
    }
  }, [rooms, roomId])

  return (
    <>
      {showRoomSelect && (
        <select
          value={roomId}
          onChange={(e) => { handleRoomIdChange(e.target.value) }}
          className={clsx(styles.field, styles.select)}
        >
          <option key='choose' value='' disabled>
            select room...
          </option>
          {rooms.result.map(roomId => (
            <option key={String(roomId)} value={String(roomId)}>
              {rooms.entities[roomId].name}
            </option>
          ))}
        </select>
      )}

      {showRoomPassword && rooms.entities[roomId]?.hasPassword && (
        <input
          type='password'
          autoComplete='off'
          className={clsx(styles.field, className)}
          onChange={(e) => { handleRoomPasswordChange(e.target.value) }}
          placeholder='room password (required)'
          ref={passwordRef}
          value={roomPassword}
        />
      )}
    </>
  )
}

export default RoomSelect
