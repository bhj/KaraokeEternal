import React, { useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import Button from 'components/Button/Button'
import AccountForm from '../../../components/AccountForm/AccountForm'
import RoomSelect from '../../../components/RoomSelect/RoomSelect'
import { createAccount } from 'store/modules/user'
import styles from './Create.css'

interface CreateProps {
  onToggle: () => void
}

const Create = ({ onToggle }: CreateProps) => {
  const user = useAppSelector(state => state.user)
  const [roomCreds, setRoomCreds] = useState({ roomId: '', roomPassword: '' })
  const dispatch = useAppDispatch()

  const handleSubmit = useCallback((data) => {
    if (!roomCreds.roomId) {
      alert('Please select a room')
      return
    }

    data.append('roomId', roomCreds.roomId)
    data.append('roomPassword', roomCreds.roomPassword)

    dispatch(createAccount(data))
  }, [dispatch, roomCreds.roomId, roomCreds.roomPassword])

  return (
    <>
      <div className={styles.heading}>
        <h2>Create Account</h2>
        <span><a onClick={onToggle}>Already have an account?</a></span>
      </div>

      <AccountForm user={user} onSubmit={handleSubmit}>
        <RoomSelect onChange={setRoomCreds} />
        <Button type='submit' variant='primary'>Create Account</Button>
      </AccountForm>
    </>
  )
}

export default Create
