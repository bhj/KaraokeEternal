import React, { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { fetchRooms } from 'store/modules/rooms'
import styles from './RoomSelect.css'
let passwordRef

interface RoomSelectProps {
  className?: string
  onSelectRef(node: HTMLSelectElement): void
  onPasswordRef(node: HTMLInputElement): void
}

const RoomSelect = (props: RoomSelectProps) => {
  const { onSelectRef, onPasswordRef } = props
  const rooms = useAppSelector(state => state.rooms)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const dispatch = useAppDispatch()

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRoomId(e.target.value), [])
  const handleSelectRef = useCallback((r: HTMLSelectElement) => onSelectRef(r), [onSelectRef])
  const handlePasswordRef = useCallback((r: HTMLInputElement) => {
    passwordRef = r
    onPasswordRef(r)
  }, [onPasswordRef])

  // once per mount
  useEffect(() => {
    (async () => dispatch(fetchRooms()))()
  }, [dispatch])

  // if there's only one open room, select it automatically
  useEffect(() => {
    if (rooms.result.length === 1) setSelectedRoomId(String(rooms.result[0]))
  }, [rooms])

  // focus room password when a room is manually selected
  useEffect(() => {
    if (rooms.result.length > 1 && selectedRoomId && rooms.entities[selectedRoomId].hasPassword) {
      passwordRef.focus()
    }
  }, [rooms, selectedRoomId])

  return (
    <>
      <select
        value={selectedRoomId}
        onChange={handleSelectChange}
        ref={handleSelectRef}
        className={`${styles.field} ${styles.select}`}
      >
        <option key='choose' value='' disabled>select room...</option>
        {rooms.result.map(roomId => (
          <option key={String(roomId)} value={String(roomId)}>{rooms.entities[roomId].name}</option>
        ))}
      </select>

      {selectedRoomId && rooms.entities[selectedRoomId].hasPassword
      && (
        <input
          type='password'
          autoComplete='off'
          className={`${styles.field} ${props.className}`}
          placeholder='room password (required)'
          ref={handlePasswordRef}
        />
      )}
    </>
  )
}

export default RoomSelect
