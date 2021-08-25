import PropTypes from 'prop-types'
import React, { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import RoomSelect from '../../../components/RoomSelect'
import { login } from 'store/modules/user'
import styles from './SignIn.css'
let roomSelectRef, roomPasswordRef

const SignIn = props => {
  const isPasswordRequired = useSelector(state => state.prefs.isPasswordRequired)
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const roomSelectRefCB = useCallback(r => { roomSelectRef = r }, [])
  const roomPasswordRefCB = useCallback(r => { roomPasswordRef = r }, [])

  const dispatch = useDispatch()
  const handleSubmit = useCallback(e => {
    e.preventDefault()
    dispatch(login({
      username: usernameRef.current.value.trim(),
      password: passwordRef.current.value,
      roomId: roomSelectRef.value,
      roomPassword: roomPasswordRef ? roomPasswordRef.value : undefined,
    }))
  }, [dispatch])

  return (
    <>
      <div className={styles.heading}>
        <h2>Sign In</h2>
        <span><a onClick={props.onToggle}>Don&rsquo;t have an account?</a></span>
      </div>

      <form noValidate>
        <input type='email'
          autoComplete='username'
          autoFocus
          placeholder='username or email'
          ref={usernameRef}
          className={styles.field}
        />
        <input type='password'
          autoComplete='current-password'
          placeholder={isPasswordRequired ? 'password' : 'password (optional)'}
          ref={passwordRef}
          className={styles.field}
        />

        <RoomSelect onSelectRef={roomSelectRefCB} onPasswordRef={roomPasswordRefCB} />

        <button onClick={handleSubmit} className='primary'>
          Sign In
        </button>
      </form>
    </>
  )
}

SignIn.propTypes = {
  onToggle: PropTypes.func.isRequired,
}

export default SignIn
