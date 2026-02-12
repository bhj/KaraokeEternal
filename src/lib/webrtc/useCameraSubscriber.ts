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

export function createCameraSubscriber (
  dispatch: (action: unknown) => void,
  onStateChange?: () => void,
): CameraSubscriber {
  let status: SubscriberStatus = 'idle'
  let pc: RTCPeerConnection | null = null
  let videoEl: HTMLVideoElement | null = null
  let hasRemoteDescription = false
  let pendingIce: CameraIcePayload[] = []

  const notifyStateChange = () => {
    onStateChange?.()
  }

  const addIceCandidate = async (ice: CameraIcePayload) => {
    if (!pc || !ice.candidate) return

    await pc.addIceCandidate(new RTCIceCandidate({
      candidate: ice.candidate,
      sdpMid: ice.sdpMid,
      sdpMLineIndex: ice.sdpMLineIndex,
    }))
  }

  const flushPendingIce = async () => {
    if (!hasRemoteDescription || !pendingIce.length) return
    const queued = pendingIce
    pendingIce = []

    for (const ice of queued) {
      await addIceCandidate(ice)
    }
  }

  const handleOffer = async (offer: CameraOfferPayload) => {
    if (pc) {
      pc.close()
    }

    status = 'connecting'
    notifyStateChange()
    hasRemoteDescription = false
    pendingIce = []

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
      if (!videoEl) {
        videoEl = document.createElement('video')
        videoEl.autoplay = true
        videoEl.playsInline = true
        videoEl.muted = true
      }

      videoEl.srcObject = ev.streams[0] ?? new MediaStream([ev.track])

      const playResult = videoEl.play?.()
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch((err: unknown): void => {
          console.debug('[CameraSubscriber] remote video play() failed', err)
        })
      }

      status = 'active'
      notifyStateChange()
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    hasRemoteDescription = true
    await flushPendingIce()

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    dispatch({
      type: CAMERA_ANSWER_REQ,
      payload: { sdp: answer.sdp, type: 'answer' },
    })
  }

  const handleIce = async (ice: CameraIcePayload) => {
    if (!pc || !ice.candidate) return

    if (!hasRemoteDescription) {
      pendingIce.push(ice)
      return
    }

    await addIceCandidate(ice)
  }

  const stop = () => {
    if (pc) {
      pc.close()
      pc = null
    }
    pendingIce = []
    hasRemoteDescription = false
    videoEl = null
    status = 'idle'
    notifyStateChange()
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
    const sub = createCameraSubscriber(
      (action) => dispatch(action),
      () => {
        setStatus(sub.getStatus())
        setVideoElement(sub.getVideoElement())
      },
    )
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
