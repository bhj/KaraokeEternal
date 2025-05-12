import React, { useCallback, useRef, useState } from 'react'
import { useAppDispatch } from 'store/hooks'
import Button from 'components/Button/Button'
import RoomSelect from '../../../components/RoomSelect/RoomSelect'
import { login } from 'store/modules/user'
import styles from './SignIn.css'

interface SignInProps {
  onToggle: () => void
}

const SignIn = ({ onToggle }: SignInProps) => {
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const [roomCreds, setRoomCreds] = useState({ roomId: '', roomPassword: '' })
  const dispatch = useAppDispatch()

  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    dispatch(login({
      username: usernameRef.current.value.trim(),
      password: passwordRef.current.value,
      roomId: roomCreds.roomId,
      roomPassword: roomCreds.roomPassword,
    }))
  }, [dispatch, roomCreds])

  return (
    <>
      <div className={styles.heading}>
        <h2>Sign In</h2>
        <span><a onClick={onToggle}>Don&rsquo;t have an account?</a></span>
      </div>

      <form noValidate>
        <RoomSelect onChange={setRoomCreds} />

        <input
          type='email'
          autoComplete='username'
          autoFocus
          placeholder='username or email'
          ref={usernameRef}
          className={styles.field}
        />
        <input
          type='password'
          autoComplete='current-password'
          placeholder='password'
          ref={passwordRef}
          className={styles.field}
        />
        <Button type='submit' onClick={handleSubmit} variant='primary'>
          Sign In
        </Button>
      </form>
    </>
  )
}

export default SignIn
