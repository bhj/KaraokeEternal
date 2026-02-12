import { useCallback, useEffect, useRef, useState } from 'react'
import socket from 'lib/socket'
import { useAppDispatch } from 'store/hooks'
import {
  CAMERA_ANSWER,
  CAMERA_ICE,
  CAMERA_STOP,
} from 'shared/actionTypes'
import { isCameraAnswer, isCameraIce, isCameraStop } from './CameraSignaling'
import { createCameraPublisher, type CameraPublisher, type CameraStartOptions, type PublisherStatus } from './useCameraPublisher'

/**
 * Manages the camera publisher lifecycle by listening for signaling
 * responses (answer, ICE, stop) on the socket. Provides start/stop
 * controls for the orchestrator to toggle camera sharing.
 */
export function useCameraSender () {
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<PublisherStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pubRef = useRef<CameraPublisher | null>(null)

  const syncState = useCallback(() => {
    if (pubRef.current) {
      setStatus(pubRef.current.getStatus())
      setStream(pubRef.current.getStream())
      setError(pubRef.current.getError())
    }
  }, [])

  // Listen for signaling responses from the subscriber (player)
  useEffect(() => {
    const handleAction = async (action: { type: string, payload?: unknown }) => {
      if (!action || typeof action.type !== 'string') return
      if (!pubRef.current) return

      switch (action.type) {
        case CAMERA_ANSWER: {
          if (!isCameraAnswer(action.payload)) return
          await pubRef.current.handleAnswer(action.payload)
          syncState()
          break
        }
        case CAMERA_ICE: {
          if (!isCameraIce(action.payload)) return
          await pubRef.current.handleIce(action.payload)
          break
        }
        case CAMERA_STOP: {
          if (!isCameraStop(action.payload)) return
          pubRef.current.stop()
          pubRef.current = null
          setStatus('idle')
          setStream(null)
          setError(null)
          break
        }
      }
    }

    socket.on('action', handleAction)
    return () => {
      socket.off('action', handleAction)
    }
  }, [syncState])

  const start = useCallback(async (options?: CameraStartOptions) => {
    if (pubRef.current) {
      pubRef.current.stop()
    }
    pubRef.current = createCameraPublisher(a => dispatch(a as { type: string }))
    await pubRef.current.start(options)
    syncState()
  }, [dispatch, syncState])

  const stop = useCallback(() => {
    if (pubRef.current) {
      pubRef.current.stop()
      pubRef.current = null
    }
    setStatus('idle')
    setStream(null)
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pubRef.current) {
        pubRef.current.stop()
        pubRef.current = null
      }
    }
  }, [])

  return { status, stream, error, start, stop }
}
