import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchRooms } from 'store/modules/rooms'
import styles from './RoomSelect.css'
let passwordRef

const RoomSelect = props => {
  const { onSelectRef, onPasswordRef } = props
  const rooms = useSelector(state => state.rooms)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const dispatch = useDispatch()

  const handleSelectChange = useCallback(e => { setSelectedRoomId(e.target.value) }, [])
  const handleSelectRef = useCallback(r => { onSelectRef(r) }, [onSelectRef])
  const handlePasswordRef = useCallback(r => {
    passwordRef = r
    onPasswordRef(r)
  }, [onPasswordRef])

  // once per mount
  useEffect(() => dispatch(fetchRooms()), [dispatch])

  // if there's only one open room, select it automatically
  useEffect(() => {
    if (rooms.result.length === 1) {
      setSelectedRoomId(rooms.result[0])
    }
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
          <option key={roomId} value={roomId}>{rooms.entities[roomId].name}</option>
        ))}
      </select>

      {selectedRoomId && rooms.entities[selectedRoomId].hasPassword &&
        <input type='password'
          autoComplete='off'
          className={`${styles.field} ${props.className}`}
          placeholder='room password (required)'
          ref={handlePasswordRef}
        />
      }
    </>
  )
}

RoomSelect.propTypes = {
  className: PropTypes.string,
  onSelectRef: PropTypes.func.isRequired,
  onPasswordRef: PropTypes.func.isRequired,
}

export default RoomSelect
