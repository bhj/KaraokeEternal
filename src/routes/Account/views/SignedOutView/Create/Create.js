import PropTypes from 'prop-types'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AccountForm from '../../../components/AccountForm'
import RoomSelect from '../../../components/RoomSelect'
import { createAccount } from 'store/modules/user'
import styles from './Create.css'
let roomSelectRef, roomPasswordRef

const Create = props => {
  const user = useSelector(state => state.user)
  const roomSelectRefCB = useCallback(r => { roomSelectRef = r }, [])
  const roomPasswordRefCB = useCallback(r => { roomPasswordRef = r }, [])

  const dispatch = useDispatch()
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

Create.propTypes = {
  onToggle: PropTypes.func.isRequired,
}

export default Create
