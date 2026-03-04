import React, { useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { requestLogout, updateAccount } from 'store/modules/user'
import { removeItem } from 'routes/Queue/modules/queue'
import getUpcoming from 'routes/Queue/selectors/getUpcoming'
import { useT } from 'i18n'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import AccountForm from '../AccountForm/AccountForm'
import styles from './Account.css'

const Account = () => {
  const t = useT()
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.user)
  const upcomingQueueIds = useAppSelector(state => getUpcoming(state, user.userId))

  const curPassword = useRef(null)
  const [isDirty, setDirty] = useState(false)

  const handleSignOut = () => {
    if (!user.isAdmin) {
      const hasUpcomingSongs = upcomingQueueIds.length > 0
      let message = ''

      if (user.isGuest && hasUpcomingSongs) {
        message = t('account', 'confirmSignOutGuestSongs')
      } else if (user.isGuest) {
        message = t('account', 'confirmSignOutGuest')
      } else if (hasUpcomingSongs) {
        message = t('account', 'confirmSignOutSongs')
      }

      if (message && !confirm(message)) return

      if (hasUpcomingSongs) {
        dispatch(removeItem({ queueId: upcomingQueueIds }))
      }
    }

    dispatch(requestLogout())
  }

  const handleSubmit = (data: FormData) => {
    if (!user.isGuest) {
      if (!curPassword.current.value.trim()) {
        alert(t('account', 'passwordRequired'))
        curPassword.current.focus()
        return
      }

      data.append('password', curPassword.current.value)
    }

    dispatch(updateAccount(data))
  }

  return (
    <Panel title={t('account', 'title')} contentClassName={styles.content}>
      <>
        <p>
          {t('account', 'signedInAs')}
&nbsp;
          <strong>{user.isGuest ? t('account', 'guestLabel') : user.username}</strong>
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
              placeholder={t('account', 'currentPassword')}
              ref={curPassword}
            />

          )}

          <div className={styles.btnContainer}>
            {isDirty && (
              <Button type='submit' variant='primary'>
                {t('account', 'updateAccount')}
              </Button>
            )}
            <Button onClick={handleSignOut} variant='default'>
              {t('account', 'signOut')}
            </Button>
          </div>
        </AccountForm>
      </>
    </Panel>
  )
}

export default Account
