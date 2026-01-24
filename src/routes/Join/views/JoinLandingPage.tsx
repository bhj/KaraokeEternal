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

  // Auto-complete join when user returns logged in
  useEffect(() => {
    if (userId && itoken && roomInfo) {
      // User just logged in via "Login with Account", complete the join
      window.location.href = `/api/rooms/join/${roomInfo.roomId}/${itoken}`
    }
  }, [userId, itoken, roomInfo])

  // Handle "Login with Account" - proper URL encoding
  const handleLoginWithAccount = () => {
    if (!config?.ssoLoginUrl || !itoken) return

    const returnUrl = `/join?itoken=${encodeURIComponent(itoken)}${guestName ? `&guest_name=${encodeURIComponent(guestName)}` : ''}`
    const loginUrl = `${config.ssoLoginUrl}?rd=${encodeURIComponent(returnUrl)}`
    window.location.href = loginUrl
  }

  // Handle "Join as Guest" - enrollment flow with guest name
  const handleJoinAsGuest = () => {
    if (!config?.authentikUrl || !itoken) return

    const enrollUrl = new URL(`${config.authentikUrl}/if/flow/${config.enrollmentFlow}/`)
    enrollUrl.searchParams.set('itoken', itoken)
    if (guestName) {
      enrollUrl.searchParams.set('guest_name', guestName)
    }
    window.location.href = enrollUrl.toString()
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
          <Button onClick={handleLoginWithAccount} variant='primary'>
            Login with Account
          </Button>
        )}
        {config?.authentikUrl && (
          <Button onClick={handleJoinAsGuest}>
            {guestName ? `Join as ${guestName}` : 'Join as Guest'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default JoinLandingPage
