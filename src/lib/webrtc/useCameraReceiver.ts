import { useCallback, useEffect, useRef, useState } from 'react'
import socket from 'lib/socket'
import { useAppDispatch } from 'store/hooks'
import {
  CAMERA_OFFER,
  CAMERA_ANSWER,
  CAMERA_ICE,
  CAMERA_STOP,
} from 'shared/actionTypes'
import { isCameraOffer, isCameraIce } from './CameraSignaling'
import { createCameraSubscriber, type CameraSubscriber, type SubscriberStatus } from './useCameraSubscriber'

/**
 * Manages the camera subscriber lifecycle by listening for camera signaling
 * actions on the socket. Returns the remote video element when a WebRTC
 * camera connection is established.
 *
 * Uses the socket directly (not Redux) because WebRTC signaling is transient
 * and requires async peer connection operations, not state updates.
 */
export function useCameraReceiver () {
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<SubscriberStatus>('idle')
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const subRef = useRef<CameraSubscriber | null>(null)

  const syncState = useCallback(() => {
    if (subRef.current) {
      setStatus(subRef.current.getStatus())
      setVideoElement(subRef.current.getVideoElement())
    }
  }, [])

  useEffect(() => {
    const handleAction = async (action: { type: string, payload?: unknown }) => {
      if (!action || typeof action.type !== 'string') return

      switch (action.type) {
        case CAMERA_OFFER: {
          if (!isCameraOffer(action.payload)) return
          // Tear down existing subscriber if any
          if (subRef.current) {
            subRef.current.stop()
          }
          subRef.current = createCameraSubscriber(a => dispatch(a as { type: string }))
          await subRef.current.handleOffer(action.payload)
          syncState()
          break
        }
        case CAMERA_ANSWER: {
          // Player (subscriber) shouldn't receive answers — those go to the publisher
          break
        }
        case CAMERA_ICE: {
          if (!isCameraIce(action.payload) || !subRef.current) return
          await subRef.current.handleIce(action.payload)
          syncState()
          break
        }
        case CAMERA_STOP: {
          if (!subRef.current) return
          subRef.current.stop()
          subRef.current = null
          setStatus('idle')
          setVideoElement(null)
          break
        }
      }
    }

    socket.on('action', handleAction)
    return () => {
      socket.off('action', handleAction)
      if (subRef.current) {
        subRef.current.stop()
        subRef.current = null
      }
    }
  }, [dispatch, syncState])

  return { status, videoElement }
}
