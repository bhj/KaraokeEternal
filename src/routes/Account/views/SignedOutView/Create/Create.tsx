import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import AccountForm from '../../../components/AccountForm/AccountForm'
import RoomSelect from '../../../components/RoomSelect/RoomSelect'
import { createAccount } from 'store/modules/user'
import styles from './Create.css'
let roomSelectRef, roomPasswordRef

interface CreateProps {
  onToggle(...args: unknown[]): unknown
}

const Create = (props: CreateProps) => {
  const user = useAppSelector(state => state.user)
  const roomSelectRefCB = useCallback(r => { roomSelectRef = r }, [])
  const roomPasswordRefCB = useCallback(r => { roomPasswordRef = r }, [])

  const dispatch = useAppDispatch()
  const handleSubmit = useCallback(data => {
    if (!roomSelectRef.value) {
      alert('Please select a room')
      roomSelectRef.focus()
      return
    }

    data.append('roomId', roomSelectRef.value)

    if (roomPasswordRef) {
      data.append('roomPassword', roomPasswordRef.value)
    }

    dispatch(createAccount(data))
  }, [dispatch])

  return (
    <>
      <div className={styles.heading}>
        <h2>Create Account</h2>
        <span><a onClick={props.onToggle}>Already have an account?</a></span>
      </div>

      <AccountForm user={user} onSubmit={handleSubmit}>
        <RoomSelect onSelectRef={roomSelectRefCB} onPasswordRef={roomPasswordRefCB} />
        <button className='primary'>Create Account</button>
      </AccountForm>
    </>
  )
}

export default Create
