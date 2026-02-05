import { useCallback, useMemo, useState } from 'react'
import {
  CAMERA_ANSWER_REQ,
  CAMERA_ICE_REQ,
} from 'shared/actionTypes'
import { STUN_SERVERS, type CameraOfferPayload, type CameraIcePayload } from './CameraSignaling'

export type SubscriberStatus = 'idle' | 'connecting' | 'active'

// ---- Testable core (no React dependency) ----

export interface CameraSubscriber {
  handleOffer: (offer: CameraOfferPayload) => Promise<void>
  handleIce: (ice: CameraIcePayload) => Promise<void>
  stop: () => void
  getStatus: () => SubscriberStatus
  getVideoElement: () => HTMLVideoElement | null
}

export function createCameraSubscriber (dispatch: (action: unknown) => void): CameraSubscriber {
  let status: SubscriberStatus = 'idle'
  let pc: RTCPeerConnection | null = null
  let videoEl: HTMLVideoElement | null = null

  const handleOffer = async (offer: CameraOfferPayload) => {
    pc = new RTCPeerConnection({ iceServers: STUN_SERVERS })

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        dispatch({
          type: CAMERA_ICE_REQ,
          payload: {
            candidate: ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex,
          },
        })
      }
    }

    pc.ontrack = (ev) => {
      const el = document.createElement('video')
      el.autoplay = true
      el.playsInline = true
      el.muted = true
      el.srcObject = ev.streams[0] ?? new MediaStream([ev.track])
      videoEl = el
      status = 'active'
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    dispatch({
      type: CAMERA_ANSWER_REQ,
      payload: { sdp: answer.sdp, type: 'answer' },
    })

    status = 'connecting'
  }

  const handleIce = async (ice: CameraIcePayload) => {
    if (!pc) return
    if (ice.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate({
        candidate: ice.candidate,
        sdpMid: ice.sdpMid,
        sdpMLineIndex: ice.sdpMLineIndex,
      }))
    }
  }

  const stop = () => {
    if (pc) {
      pc.close()
      pc = null
    }
    videoEl = null
    status = 'idle'
  }

  return {
    handleOffer,
    handleIce,
    stop,
    getStatus: () => status,
    getVideoElement: () => videoEl,
  }
}

// ---- React hook wrapper ----

export function useCameraSubscriber (dispatch: (action: unknown) => void) {
  const [status, setStatus] = useState<SubscriberStatus>('idle')
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  const subscriber = useMemo(() => {
    const sub = createCameraSubscriber((action) => {
      dispatch(action)
      setStatus(sub.getStatus())
      setVideoElement(sub.getVideoElement())
    })
    return sub
  }, [dispatch])

  const handleOffer = useCallback(async (offer: CameraOfferPayload) => {
    await subscriber.handleOffer(offer)
    setStatus(subscriber.getStatus())
    setVideoElement(subscriber.getVideoElement())
  }, [subscriber])

  const handleIce = useCallback(async (ice: CameraIcePayload) => {
    await subscriber.handleIce(ice)
  }, [subscriber])

  const stop = useCallback(() => {
    subscriber.stop()
    setStatus(subscriber.getStatus())
    setVideoElement(subscriber.getVideoElement())
  }, [subscriber])

  return { status, videoElement, handleOffer, handleIce, stop }
}
