import React, { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { requestLogout, updateAccount } from 'store/modules/user'
import { leaveRoom } from 'store/modules/rooms'
import { removeItem } from 'routes/Queue/modules/queue'
import getUpcoming from 'routes/Queue/selectors/getUpcoming'
import { getRouteAccessDecision } from 'components/App/Routes/routeAccess'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import AccountForm from '../AccountForm/AccountForm'
import styles from './Account.css'

const Account = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(state => state.user)
  const upcomingQueueIds = useAppSelector(state => getUpcoming(state, user.userId))
  const room = useAppSelector(state => {
    const roomId = state.user.roomId
    return typeof roomId === 'number' ? state.rooms.entities[roomId] : null
  })

  const curPassword = useRef(null)
  const [isDirty, setDirty] = useState(false)
  const isVisitingAnotherRoom = user.roomId !== null
    && user.ownRoomId !== null
    && user.roomId !== user.ownRoomId

  const isRoomOwner = user.roomId !== null
    && user.ownRoomId !== null
    && user.roomId === user.ownRoomId

  const canAccessCameraRelay = getRouteAccessDecision({
    path: '/camera',
    isAdmin: user.isAdmin,
    isRoomOwner,
    prefs: room?.prefs,
  }).allowed
  const shouldShowCameraRelayButton = canAccessCameraRelay

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

  const handleReturnToOwnRoom = useCallback(() => {
    if (!isVisitingAnotherRoom) return

    const confirmed = confirm(
      'Are you sure you want to leave the current party and return to your own room?\n\nYou will exit this room and start your own room session.',
    )

    if (!confirmed) return

    dispatch(leaveRoom())
  }, [dispatch, isVisitingAnotherRoom])

  const handleOpenCameraRelay = useCallback(() => {
    navigate('/camera')
  }, [navigate])

  const handleSubmit = useCallback((data: FormData) => {
    // SSO users don't need to provide current password (they can only change display name/image)
    if (!user.isGuest && user.authProvider !== 'sso') {
      if (!curPassword.current.value.trim()) {
        alert('Please enter your current password to make changes.')
        curPassword.current.focus()
        return
      }

      data.append('password', curPassword.current.value)
    }

    dispatch(updateAccount(data))
  }, [dispatch, user.isGuest, user.authProvider])

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
          showUsername={!user.isGuest && user.authProvider !== 'sso'}
          showPassword={!user.isGuest && user.authProvider !== 'sso'}
        >
          {isDirty && !user.isGuest && user.authProvider !== 'sso' && (
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
            {shouldShowCameraRelayButton && (
              <Button onClick={handleOpenCameraRelay} variant='default'>
                Open Camera Relay
              </Button>
            )}
            <Button onClick={handleSignOut} variant='default'>
              Sign Out
            </Button>
            {isVisitingAnotherRoom && (
              <Button onClick={handleReturnToOwnRoom} variant='default'>
                Back to My Room
              </Button>
            )}
          </div>
        </AccountForm>
      </>
    </Panel>
  )
}

export default Account
