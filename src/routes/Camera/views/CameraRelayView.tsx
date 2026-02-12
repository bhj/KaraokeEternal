import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useCameraSender } from 'lib/webrtc/useCameraSender'
import type { CameraFacingMode } from 'lib/webrtc/useCameraPublisher'
import styles from './CameraRelayView.css'

function CameraRelayView () {
  const camera = useCameraSender()
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('environment')
  const previewRef = useRef<HTMLVideoElement>(null)

  const isSharing = camera.status === 'connecting' || camera.status === 'active'
  const isSecureContext = typeof window === 'undefined' ? true : window.isSecureContext

  useEffect(() => {
    const el = previewRef.current
    if (!el) return

    el.srcObject = camera.stream

    if (camera.stream) {
      // iOS Safari sometimes needs an explicit play() after srcObject is set.
      const playPromise = el.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err: unknown): void => {
          console.debug('[CameraRelayView] preview play() failed', err)
        })
      }
    }
  }, [camera.stream])

  const handleStartStop = useCallback(async () => {
    if (isSharing) {
      camera.stop()
      return
    }
    await camera.start({ facingMode })
  }, [camera, facingMode, isSharing])

  let statusLabel = 'Idle'
  if (camera.status === 'connecting') statusLabel = 'Connecting'
  if (camera.status === 'active') statusLabel = 'Live'
  if (camera.status === 'error') statusLabel = 'Error'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.heading}>Camera Relay</div>
        <div className={styles.subheading}>
          Open this page on a phone in the same room to relay camera into player visuals.
        </div>

        {!isSecureContext && (
          <div className={styles.warning}>
            Camera permissions on iPhone Safari require HTTPS. Open the secure room URL, then tap Start.
          </div>
        )}

        {camera.error && (
          <div className={styles.error}>{camera.error}</div>
        )}

        <div className={styles.controls}>
          <button
            type='button'
            className={`${styles.modeButton} ${facingMode === 'environment' ? styles.modeButtonActive : ''}`}
            onClick={() => setFacingMode('environment')}
            disabled={isSharing}
          >
            Rear Camera
          </button>
          <button
            type='button'
            className={`${styles.modeButton} ${facingMode === 'user' ? styles.modeButtonActive : ''}`}
            onClick={() => setFacingMode('user')}
            disabled={isSharing}
          >
            Front Camera
          </button>
          <button
            type='button'
            data-role='camera-start-stop'
            className={`${styles.startStopButton} ${isSharing ? styles.startStopButtonStop : ''}`}
            onClick={handleStartStop}
          >
            {isSharing ? 'Stop Camera Relay' : 'Start Camera Relay'}
          </button>
        </div>

        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Status</span>
          <span className={styles.statusValue}>{statusLabel}</span>
        </div>

        <div className={styles.previewWrap}>
          <video
            ref={previewRef}
            className={styles.preview}
            autoPlay
            muted
            playsInline
          />
          {!camera.stream && (
            <div className={styles.previewPlaceholder}>Preview appears after camera access is granted.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CameraRelayView
