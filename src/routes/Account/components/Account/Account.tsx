import React, { useCallback, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { requestLogout, updateAccount } from 'store/modules/user'
import AccountForm from '../AccountForm/AccountForm'
import styles from './Account.css'

const Account = () => {
  const curPassword = useRef(null)

  const user = useAppSelector(state => state.user)
  const [isDirty, setDirty] = useState(false)

  const dispatch = useAppDispatch()
  const handleDirtyChange = useCallback(isDirty => setDirty(isDirty), [])
  const handleSignOut = useCallback(() => dispatch(requestLogout()), [dispatch])
  const handleSubmit = useCallback((data) => {
    if (!curPassword.current.value.trim()) {
      alert('Please enter your current password to make changes.')
      curPassword.current.focus()
      return
    }

    data.append('password', curPassword.current.value)
    dispatch(updateAccount(data))
  }, [dispatch])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Account</h1>
      <div className={styles.content}>
        <p>
          Signed in as
          <strong>{user.username}</strong>
        </p>

        <AccountForm user={user} onDirtyChange={handleDirtyChange} onSubmit={handleSubmit}>
          {isDirty
          && (
            <>
              <br />
              <input
                type='password'
                autoComplete='current-password'
                placeholder='current password'
                ref={curPassword}
              />
              <button className={`primary ${styles.updateAccount}`}>
                Update Account
              </button>
            </>
          )}
        </AccountForm>

        <button onClick={handleSignOut} className={styles.signOut}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Account
