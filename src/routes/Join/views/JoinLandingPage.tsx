import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from 'store/hooks'
import HttpApi from 'lib/HttpApi'
import Logo from 'components/Logo/Logo'
import Button from 'components/Button/Button'
import styles from './JoinLandingPage.css'

const api = new HttpApi('')

interface RoomInfo {
  roomName: string
  roomId: number
}

interface PublicPrefs {
  authentikUrl: string | null
  enrollmentFlow: string
  ssoMode: boolean
  ssoLoginUrl: string | null
}

const JoinLandingPage = () => {
  const [searchParams] = useSearchParams()
  const itoken = searchParams.get('itoken')
  const guestName = searchParams.get('guest_name')

  const { userId } = useAppSelector(state => state.user)

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [config, setConfig] = useState<PublicPrefs | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  // Fetch room info and public config on mount
  useEffect(() => {
    if (!itoken) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [roomRes, configRes] = await Promise.all([
          api.get<RoomInfo>(`rooms/join/validate?itoken=${encodeURIComponent(itoken)}`),
          api.get<PublicPrefs>('prefs/public'),
        ])
        setRoomInfo(roomRes)
        setConfig(configRes)
      } catch {
        setError('Invalid or expired invitation')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [itoken])

  // Auto-complete join for users who already have a session
  // (e.g., logged-in user who manually navigates to a /join link)
  useEffect(() => {
    if (userId && itoken && roomInfo) {
      window.location.href = `/api/rooms/join/${roomInfo.roomId}/${itoken}`
    }
  }, [userId, itoken, roomInfo])

  // Handle "Login with Account" - redirect to non-bypassed route for session establishment
  const handleLoginWithAccount = () => {
    if (!config?.ssoLoginUrl || !roomInfo) return

    // Return to /library?roomId=X (not bypassed) so forward_auth establishes session
    // App.tsx handles roomId param and shows RoomJoinPrompt for standard users
    const returnUrl = `/library?roomId=${roomInfo.roomId}`
    const loginUrl = `${config.ssoLoginUrl}?rd=${encodeURIComponent(returnUrl)}`
    window.location.href = loginUrl
  }

  // Handle "Join as Guest" - app-managed guest session (no Authentik involvement)
  const handleJoinAsGuest = async () => {
    if (!roomInfo || !itoken || !guestName) return

    setJoining(true)
    setError(null)

    try {
      await api.post('guest/join', {
        body: {
          roomId: roomInfo.roomId,
          inviteCode: itoken,
          guestName: guestName,
        },
      })
      // Success - redirect to library (cookie is set by server)
      window.location.href = '/library'
    } catch (err) {
      setError((err as Error).message || 'Failed to join room')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Logo className={styles.logo} />
        <p className={styles.loading}>Loading...</p>
      </div>
    )
  }

  if (error || !roomInfo) {
    return (
      <div className={styles.container}>
        <Logo className={styles.logo} />
        <h1>Oops!</h1>
        <p className={styles.error}>{error || 'Something went wrong'}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Logo className={styles.logo} />

      <h1>Join Room</h1>
      <p className={styles.roomName}>{roomInfo.roomName}</p>

      {guestName && (
        <div className={styles.guestPreview}>
          <p>Join as</p>
          <p className={styles.guestName}>{guestName}</p>
        </div>
      )}

      <div className={styles.buttons}>
        {config?.ssoLoginUrl && (
          <Button onClick={handleLoginWithAccount} variant='primary' disabled={joining}>
            Login with Account
          </Button>
        )}
        {guestName && (
          <Button onClick={handleJoinAsGuest} disabled={joining}>
            {joining ? 'Joining...' : `Join as ${guestName}`}
          </Button>
        )}
      </div>
    </div>
  )
}

export default JoinLandingPage
