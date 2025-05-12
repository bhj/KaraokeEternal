import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useAppDispatch } from 'store/hooks'
import { createRoom, removeRoom, updateRoom, requestPrefsPush } from 'store/modules/rooms'
import { getFormData } from 'lib/util'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import UserPrefs from './UserPrefs/UserPrefs'
import QRPrefs from './QRPrefs/QRPrefs'
import type { Room, IRoomPrefs } from 'shared/types'
import styles from './EditRoom.css'

interface EditRoomProps {
  room?: Room
  onClose: () => void
}

const EditRoom = ({ onClose, room }: EditRoomProps) => {
  const formRef = useRef(null)
  const [roomPassword, setRoomPassword] = useState(room && room.hasPassword ? '*'.repeat(32) : '')
  const [prefs, setPrefs] = useState<IRoomPrefs>(room?.prefs || {} as IRoomPrefs)
  const [isPasswordDirty, setIsPasswordDirty] = useState(false)
  const dispatch = useAppDispatch()

  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    const data = getFormData(new FormData(formRef.current)) as Record<string, string | IRoomPrefs>
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

  const handlePasswordChange = useCallback((e) => {
    setIsPasswordDirty(true)
    setRoomPassword(e.target.value)
  }, [])

  useEffect(() => {
    if (room?.prefs) setPrefs(room.prefs)
  }, [room])

  return (
    <Modal
      className={styles.modal}
      onClose={handleClose}
      title={room ? 'Edit Room' : 'Create Room'}
    >
      <form onSubmit={handleSubmit} ref={formRef} className={styles.form}>
        <div className={styles.fieldContainer}>
          <input
            type='text'
            autoComplete='off'
            defaultValue={room ? room.name : ''}
            name='name'
            placeholder='room name'
            // https://github.com/facebook/react/issues/23301
            ref={r => typeof room === 'undefined' ? r?.setAttribute('autofocus', 'true') : undefined}
          />

          <input
            type='password'
            autoComplete='new-password'
            value={roomPassword}
            name='password'
            onChange={handlePasswordChange}
            onFocus={e => e.target.select()}
            placeholder='room password (optional)'
          />

          <select
            name='status'
            defaultValue={room?.status ?? 'open'}
          >
            <option value='open'>Open</option>
            <option value='closed'>Closed</option>
          </select>
        </div>

        <div className={styles.prefsContainer}>
          <UserPrefs prefs={prefs} onChange={handlePrefsChange} />
          <QRPrefs prefs={prefs} onChange={handlePrefsChange} roomPassword={roomPassword} roomPasswordDirty={isPasswordDirty} />
        </div>

        <div className={styles.btnContainer}>
          <Button type='submit' variant='primary' className={styles.btn}>
            {room ? 'Update Room' : 'Create Room'}
          </Button>
          {room && (
            <Button onClick={handleRemoveClick} className={styles.btn} variant='danger'>
              Remove Room
            </Button>
          )}
          <Button onClick={handleClose} variant='default'>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EditRoom
