import React, { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { requestLogout, updateAccount } from 'store/modules/user'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import AccountForm from '../AccountForm/AccountForm'
import styles from './Account.css'

const Account = () => {
  const curPassword = useRef(null)

  const user = useAppSelector(state => state.user)
  const [isDirty, setDirty] = useState(false)

  const dispatch = useAppDispatch()
  const handleSignOut = useCallback(() => {
    if (user.isGuest && !confirm(`As a guest, you won't be able to sign back in to the same account.\nAre you sure you want to sign out?`)) {
      return
    }

    dispatch(requestLogout())
  }, [dispatch, user.isGuest])

  const handleSubmit = useCallback((data) => {
    if (!user.isGuest) {
      if (!curPassword.current.value.trim()) {
        alert('Please enter your current password to make changes.')
        curPassword.current.focus()
        return
      }

      data.append('password', curPassword.current.value)
    }

    dispatch(updateAccount(data))
  }, [dispatch, user.isGuest])

  return (
    <Panel title='My Account' contentClassName={styles.content}>
      <>
        <p>
          Signed in as&nbsp;
          <strong>{user.isGuest ? 'guest' : user.username}</strong>
        </p>

        <AccountForm
          user={user}
          onDirtyChange={setDirty}
          onSubmit={handleSubmit}
          showUsername={!user.isGuest}
          showPassword={!user.isGuest}
        >
          {isDirty && !user.isGuest && (
            <input
              type='password'
              autoComplete='current-password'
              placeholder='current password'
              ref={curPassword}
            />

          )}
          {isDirty && (
            <Button type='submit' className={clsx('primary', styles.updateAccount)} variant='primary'>
              Update Account
            </Button>
          )}
        </AccountForm>

        <Button onClick={handleSignOut} className={styles.signOut} variant='default'>
          Sign Out
        </Button>
      </>
    </Panel>
  )
}

export default Account
