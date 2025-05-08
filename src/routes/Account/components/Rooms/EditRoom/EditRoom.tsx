import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useAppDispatch } from 'store/hooks'
import { createRoom, removeRoom, updateRoom, requestPrefsPush } from 'store/modules/rooms'
import Modal from 'components/Modal/Modal'
import RoomPrefs from '../RoomPrefs/RoomPrefs'
import type { Room, IRoomPrefs } from 'shared/types'
import { getFormData } from 'lib/util'
import styles from './EditRoom.css'

interface EditRoomProps {
  room?: Room
  onClose: () => void
}

const EditRoom = ({ onClose, room }: EditRoomProps) => {
  const formRef = useRef(null)
  const [prefs, setPrefs] = useState<IRoomPrefs>(room?.prefs || {} as IRoomPrefs)
  const [isPasswordDirty, setIsPasswordDirty] = useState(false)
  const dispatch = useAppDispatch()

  // Initialize prefs from room when component mounts or room changes
  useEffect(() => {
    if (room?.prefs) {
      setPrefs(room.prefs)
    }
  }, [room])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    const data = getFormData(new FormData(formRef.current)) as Record<string, string | IRoomPrefs>
    data.status = data.status ? 'open' : 'closed'
    data.prefs = prefs

    if (room) {
      if (!isPasswordDirty) delete data.password
      dispatch(updateRoom({ roomId: room.roomId, data }))
    } else {
      if (!data.password) delete data.password
      dispatch(createRoom(data))
    }
  }, [dispatch, prefs, room, isPasswordDirty])

  const handleRemoveClick = useCallback(() => {
    if (room && confirm(`Remove room "${room.name}" and its queue?`)) {
      dispatch(removeRoom(room.roomId))
    }
  }, [dispatch, room])

  const handlePrefsChange = useCallback((newPrefs: IRoomPrefs) => {
    setPrefs(newPrefs)
    if (room) {
      dispatch(requestPrefsPush(room.roomId, newPrefs))
    }
  }, [dispatch, room])

  const handleClose = useCallback(() => {
    // emit initial prefs
    if (room) {
      dispatch(requestPrefsPush(room.roomId, room.prefs))
    }
    onClose()
  }, [dispatch, onClose, room])

  const handlePasswordChange = useCallback(() => {
    setIsPasswordDirty(true)
  }, [])

  return (
    <Modal
      onClose={handleClose}
      title={room ? 'Edit Room' : 'Create Room'}
      className={styles.modal}
    >
      <form onSubmit={handleSubmit} ref={formRef} className={styles.form}>
        <input
          type='text'
          autoComplete='off'
          autoFocus={typeof room === 'undefined'}
          className={styles.field}
          defaultValue={room ? room.name : ''}
          name='name'
          placeholder='room name'
        />

        <input
          type='password'
          autoComplete='new-password'
          className={styles.field}
          defaultValue={room && room.hasPassword ? '*'.repeat(32) : ''}
          name='password'
          onChange={handlePasswordChange}
          onFocus={e => e.target.select()}
          placeholder='room password (optional)'
        />

        <label>
          <input
            type='checkbox'
            defaultChecked={!room || room.status === 'open'}
            name='status'
          />
           &nbsp;Open
        </label>
        <br />
        <br />

        <RoomPrefs prefs={prefs} onChange={handlePrefsChange} />

        <button type='submit' className={`${styles.btn} primary`}>
          {room ? 'Update Room' : 'Create Room'}
        </button>

        {room && (
          <button type='button' onClick={handleRemoveClick} className={styles.btn}>
            Remove Room
          </button>
        )}

        <button type='button' onClick={handleClose}>Cancel</button>
      </form>
    </Modal>
  )
}

export default EditRoom
