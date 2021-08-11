import PropTypes from 'prop-types'
import React, { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import RoomSelect from '../../../components/RoomSelect'
import { login } from 'store/modules/user'
import styles from './SignIn.css'

let roomSelectRef

const SignIn = props => {
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const roomSelectRefCB = useCallback(node => { roomSelectRef = node }, [])

  const dispatch = useDispatch()
  const handleSubmit = useCallback(e => {
    e.preventDefault()
    dispatch(login({
      username: usernameRef.current.value.trim(),
      password: passwordRef.current.value,
      roomId: roomSelectRef.select.current.value,
      roomPassword: roomSelectRef.password.current ? roomSelectRef.password.current.value : undefined,
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
          placeholder='password'
          ref={passwordRef}
          className={styles.field}
        />

        <RoomSelect ref={roomSelectRefCB}/>

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
