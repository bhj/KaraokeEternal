import React, { useCallback, useEffect, useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import Panel from 'components/Panel/Panel'
import Button from 'components/Button/Button'
import HttpApi from 'lib/HttpApi'
import styles from './MyRoom.css'

interface MyRoomData {
  room: {
    roomId: number
    name: string
    status: string
    invitationToken: string | null
    enrollmentUrl: string | null
  } | null
}

const MyRoom = () => {
  const [data, setData] = useState<MyRoomData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const api = new HttpApi('rooms')
    api.get<MyRoomData>('/my')
      .then(setData)
      .catch(() => setData(null))
  }, [])

  const handleCopy = useCallback(() => {
    if (data?.room?.enrollmentUrl) {
      navigator.clipboard.writeText(data.room.enrollmentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [data])

  if (!data) {
    return null // Loading
  }

  if (!data.room) {
    return (
      <Panel title='My Room'>
        <p className={styles.noRoom}>No room found. Please refresh the page.</p>
      </Panel>
    )
  }

  const { room } = data

  return (
    <Panel title='My Room' contentClassName={styles.content}>
      <p>
        Room: <strong>{room.name}</strong> ({room.status})
      </p>

      {room.enrollmentUrl ? (
        <>
          <div className={styles.qrContainer}>
            <QRCode
              value={room.enrollmentUrl}
              ecLevel='L'
              size={180}
              quietZone={10}
              logoImage={`${document.baseURI}assets/app.png`}
              logoWidth={60}
              logoHeight={60}
              logoOpacity={0.5}
              qrStyle='dots'
            />
            <span className={styles.qrLabel}>Scan to join as guest</span>
          </div>

          <div className={styles.urlContainer}>
            <label>Guest invite link:</label>
            <input
              type='text'
              className={styles.urlInput}
              value={room.enrollmentUrl}
              readOnly
              onFocus={e => e.target.select()}
            />
            <Button
              className={styles.copyBtn}
              onClick={handleCopy}
              variant='default'
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </>
      ) : (
        <p className={styles.noRoom}>
          Guest invitations not configured. Contact admin to set up Authentik integration.
        </p>
      )}
    </Panel>
  )
}

export default MyRoom
