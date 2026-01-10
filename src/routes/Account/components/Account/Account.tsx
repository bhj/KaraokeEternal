import React, { useCallback, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { requestLogout, updateAccount } from 'store/modules/user'
import { removeItem } from 'routes/Queue/modules/queue'
import getUpcoming from 'routes/Queue/selectors/getUpcoming'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import AccountForm from '../AccountForm/AccountForm'
import styles from './Account.css'

const Account = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.user)
  const upcomingQueueIds = useAppSelector(state => getUpcoming(state, user.userId))

  const curPassword = useRef(null)
  const [isDirty, setDirty] = useState(false)

  const handleSignOut = useCallback(() => {
    if (!user.isAdmin) {
      const hasUpcomingSongs = upcomingQueueIds.length > 0
      let message = ''

      if (user.isGuest && hasUpcomingSongs) {
        message = `Are you sure you want to sign out?\n\nYour upcoming songs will be removed from the queue, and as a guest, you won't be able to sign back into this account.`
      } else if (user.isGuest) {
        message = `Are you sure you want to sign out?\n\nAs a guest, you won't be able to sign back into this account.`
      } else if (hasUpcomingSongs) {
        message = `Are you sure you want to sign out?\n\nYour upcoming songs will be removed from the queue.`
      }

      if (message && !confirm(message)) return

      if (hasUpcomingSongs) {
        dispatch(removeItem({ queueId: upcomingQueueIds }))
      }
    }

    dispatch(requestLogout())
  }, [dispatch, upcomingQueueIds, user.isAdmin, user.isGuest])

  const handleSubmit = useCallback((data: FormData) => {
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

          <div className={styles.btnContainer}>
            {isDirty && (
              <Button type='submit' variant='primary'>
                Update Account
              </Button>
            )}
            <Button onClick={handleSignOut} variant='default'>
              Sign Out
            </Button>
          </div>
        </AccountForm>
      </>
    </Panel>
  )
}

export default Account
