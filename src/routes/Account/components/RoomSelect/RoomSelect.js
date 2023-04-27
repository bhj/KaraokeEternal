import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchRooms } from 'store/modules/rooms'
import { useSearchParams } from "react-router-dom";
import styles from './RoomSelect.css'
let passwordRef

const RoomSelect = props => {
  const { onSelectRef, onPasswordRef } = props
  const rooms = useSelector(state => state.rooms)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const dispatch = useDispatch()

  const [searchParams] = useSearchParams();


  const handleSelectChange = useCallback(e => { setSelectedRoomId(e.target.value) }, [])
  const handleSelectRef = useCallback(r => { onSelectRef(r) }, [onSelectRef])
  const handlePasswordRef = useCallback(r => {
    passwordRef = r
    onPasswordRef(r)
  }, [onPasswordRef])

  // once per mount
  useEffect(() => {
    (async () => dispatch(fetchRooms()))()
  }, [dispatch])

  // if there's only one open room, select it automatically
  useEffect(() => {
    if (rooms.result.length === 1) {
      setSelectedRoomId(rooms.result[0])
    }
  }, [rooms])

  useEffect(() => {
    // If roomId is set, select it
    if (searchParams.get('roomId')) {
      if (rooms.result.length >= 1) {
        setSelectedRoomId(searchParams.get('roomId'));
      }
    }
    // If roomPwd is set, set it
    if (searchParams.get('roomToken')) {
      setTimeout(() => { // not sure the best way to wait for passwordRef?
        if (rooms.result.length >= 1 && passwordRef) {
          passwordRef.value = searchParams.get('roomToken');
        }
      });
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
