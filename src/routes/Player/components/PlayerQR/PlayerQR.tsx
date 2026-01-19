import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import clsx from 'clsx'
import { useAppSelector } from 'store/hooks'
import { CSSTransition } from 'react-transition-group'
import { QRCode } from 'react-qrcode-logo'
import type { QueueItem, IRoomPrefs } from 'shared/types'
import HttpApi from 'lib/HttpApi'
import styles from './PlayerQR.css'

const MIN_STATIC_MS = 10000 // 10 sec
const MAX_STATIC_MS = 180000 // 3 min

interface PublicConfig {
  authentikUrl?: string | null
  enrollmentFlow?: string
}

interface PlayerQRProps {
  height: number
  prefs: IRoomPrefs['qr']
  invitationToken?: string | null
  queueItem: QueueItem
}

const PlayerQR = ({ height, prefs, invitationToken, queueItem }: PlayerQRProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const maxTimerID = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastToggleTime = useRef<number>(0)
  const [show, setShow] = useState(true)
  const [alternate, setAlternate] = useState(false)
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null)
  const { isPlaying } = useAppSelector(state => state.player)
  const { roomId } = useAppSelector(state => state.user)

  // Fetch public config for Authentik URL
  useEffect(() => {
    const api = new HttpApi('prefs')
    api.get<PublicConfig>('/public')
      .then(setPublicConfig)
      .catch(() => setPublicConfig(null))
  }, [])

  const scheduleNextToggle = useCallback(() => {
    if (maxTimerID.current) {
      clearTimeout(maxTimerID.current)
      maxTimerID.current = null
    }

    // wait for current song to end?
    if (isPlaying) return

    const now = Date.now()
    const timeSinceLastToggle = now - lastToggleTime.current
    const timeUntilMax = Math.max(MAX_STATIC_MS - timeSinceLastToggle, 0)

    maxTimerID.current = setTimeout(() => {
      setShow(false)
    }, timeUntilMax)
  }, [isPlaying])

  useEffect(() => {
    lastToggleTime.current = Date.now()
  }, [])

  useEffect(() => {
    scheduleNextToggle()

    return () => {
      if (maxTimerID.current) clearTimeout(maxTimerID.current)
    }
  }, [isPlaying, scheduleNextToggle])

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastToggle = now - lastToggleTime.current

    if (timeSinceLastToggle > MIN_STATIC_MS) {
      const timeout = setTimeout(() => setShow(false), 0)
      return () => clearTimeout(timeout)
    }
  }, [queueItem?.queueId])

  const handleTransitionEnd = useCallback(() => {
    if (!show) {
      setAlternate(prev => !prev)
      setShow(true) // trigger enter transition
      lastToggleTime.current = Date.now()

      scheduleNextToggle()
    }
  }, [show, scheduleNextToggle])

  const url = useMemo(() => {
    // If Authentik is configured and we have an invitation token, use enrollment URL
    if (publicConfig?.authentikUrl && invitationToken) {
      const authUrl = new URL(publicConfig.authentikUrl)
      authUrl.pathname = `/if/flow/${publicConfig.enrollmentFlow}/`
      authUrl.searchParams.set('itoken', invitationToken)

      // Build next URL with roomId (respect base path from <base> tag)
      const nextUrl = new URL(window.location.href)
      nextUrl.pathname = new URL(document.baseURI).pathname // Use base path, not /player
      nextUrl.search = ''
      nextUrl.searchParams.set('roomId', String(roomId))
      authUrl.searchParams.set('next', nextUrl.toString())

      return authUrl
    }

    // Fallback to existing QR logic (direct room join for non-Authentik setups)
    const url = new URL(window.location.href)
    url.pathname = url.pathname.replace(/\/player$/, '')
    url.searchParams.append('roomId', String(roomId))

    if (prefs.password) {
      url.searchParams.append('password', btoa(prefs.password))
    }

    return url
  }, [roomId, prefs.password, invitationToken, publicConfig])

  const size = Math.round(height * (0.05 + (prefs.size ?? 0.5) / 5)) // min: 5vh, max: 25vh
  const quietZoneSize = 5 + (10 * (prefs.size ?? 0.5)) // min: 5px, max: 15px

  return (
    <CSSTransition
      in={show}
      nodeRef={ref}
      classNames={{
        enterActive: styles.enterActive,
        exitActive: styles.exitActive,
      }}
      addEndListener={(done: () => void) => {
        const node = ref.current
        if (!node) return

        const onTransitionEnd = (e: Event) => {
          if (e.target !== node) return // ignore bubbling from children
          node.removeEventListener('transitionend', onTransitionEnd)
          done() // required for react-transition-group
          handleTransitionEnd()
        }

        node.addEventListener('transitionend', onTransitionEnd, false)
      }}
    >
      <div
        className={clsx(styles.container, alternate && styles.alternate)}
        ref={ref}
      >
        <QRCode
          value={url.href}
          ecLevel='L'
          size={size}
          quietZone={quietZoneSize}
          style={{ opacity: prefs.opacity ?? 0.625 }}
          logoImage={`${document.baseURI}assets/app.png`}
          logoWidth={size * 0.5}
          logoHeight={size * 0.5}
          logoOpacity={0.5}
          qrStyle='dots'
        />
      </div>
    </CSSTransition>
  )
}

export default PlayerQR
