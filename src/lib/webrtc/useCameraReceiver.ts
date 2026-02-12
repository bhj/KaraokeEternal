import { useCallback, useEffect, useRef, useState } from 'react'
import socket from 'lib/socket'
import { useAppDispatch } from 'store/hooks'
import {
  CAMERA_OFFER,
  CAMERA_ANSWER,
  CAMERA_ICE,
  CAMERA_STOP,
} from 'shared/actionTypes'
import { isCameraOffer, isCameraIce, type CameraIcePayload } from './CameraSignaling'
import { createCameraSubscriber, type CameraSubscriber, type SubscriberStatus } from './useCameraSubscriber'

const debug = (...args: unknown[]) => console.debug('[CameraReceiver]', ...args)

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
  const pendingIceRef = useRef<CameraIcePayload[]>([])

  const syncState = useCallback(() => {
    if (subRef.current) {
      setStatus(subRef.current.getStatus())
      setVideoElement(subRef.current.getVideoElement())
    }
  }, [])

  useEffect(() => {
    const handleAction = async (action: { type: string, payload?: unknown }) => {
      if (!action || typeof action.type !== 'string') return

      debug('socket action', { type: action.type })

      switch (action.type) {
        case CAMERA_OFFER: {
          debug('received offer', { hasSubscriber: Boolean(subRef.current) })
          if (!isCameraOffer(action.payload)) return
          // Tear down existing subscriber if any
          if (subRef.current) {
            subRef.current.stop()
          }
          subRef.current = createCameraSubscriber(
            a => dispatch(a as { type: string }),
            syncState,
          )
          await subRef.current.handleOffer(action.payload)
          debug('offer handled')

          // Apply any ICE that arrived before the offer action.
          if (pendingIceRef.current.length > 0) {
            const pending = pendingIceRef.current
            pendingIceRef.current = []
            for (const ice of pending) {
              await subRef.current.handleIce(ice)
            }
          }

          syncState()
          break
        }
        case CAMERA_ANSWER: {
          // Player (subscriber) shouldn't receive answers - those go to the publisher
          break
        }
        case CAMERA_ICE: {
          debug('received ICE', { hasSubscriber: Boolean(subRef.current) })
          if (!isCameraIce(action.payload)) return

          if (!subRef.current) {
            pendingIceRef.current.push(action.payload)
            debug('queued ICE until subscriber exists', { queued: pendingIceRef.current.length })
            return
          }

          await subRef.current.handleIce(action.payload)
          syncState()
          break
        }
        case CAMERA_STOP: {
          debug('received stop')
          pendingIceRef.current = []
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
      pendingIceRef.current = []
      if (subRef.current) {
        subRef.current.stop()
        subRef.current = null
      }
    }
  }, [dispatch, syncState])

  return { status, videoElement }
}
