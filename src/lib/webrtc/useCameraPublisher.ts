import { useCallback, useMemo, useState } from 'react'
import {
  CAMERA_OFFER_REQ,
  CAMERA_ICE_REQ,
  CAMERA_STOP_REQ,
} from 'shared/actionTypes'
import { STUN_SERVERS, type CameraAnswerPayload, type CameraIcePayload } from './CameraSignaling'

export type PublisherStatus = 'idle' | 'connecting' | 'active' | 'error'

// ---- Testable core (no React dependency) ----

export interface CameraPublisher {
  start: () => Promise<void>
  stop: () => void
  handleAnswer: (answer: CameraAnswerPayload) => Promise<void>
  handleIce: (ice: CameraIcePayload) => Promise<void>
  getStatus: () => PublisherStatus
  getStream: () => MediaStream | null
}

export function createCameraPublisher (dispatch: (action: unknown) => void): CameraPublisher {
  let status: PublisherStatus = 'idle'
  let stream: MediaStream | null = null
  let pc: RTCPeerConnection | null = null

  const start = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      stream = mediaStream

      pc = new RTCPeerConnection({ iceServers: STUN_SERVERS })

      for (const track of mediaStream.getTracks()) {
        pc.addTrack(track, mediaStream)
      }

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

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      dispatch({
        type: CAMERA_OFFER_REQ,
        payload: { sdp: offer.sdp, type: 'offer' },
      })

      status = 'connecting'
    } catch (err) {
      console.warn('[CameraPublisher] start failed:', err)
      status = 'error'
    }
  }

  const handleAnswer = async (answer: CameraAnswerPayload) => {
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
    status = 'active'
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
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
    }
    stream = null

    if (pc) {
      pc.close()
      pc = null
    }

    dispatch({ type: CAMERA_STOP_REQ, payload: {} })
    status = 'idle'
  }

  return {
    start,
    stop,
    handleAnswer,
    handleIce,
    getStatus: () => status,
    getStream: () => stream,
  }
}

// ---- React hook wrapper ----

export function useCameraPublisher (dispatch: (action: unknown) => void) {
  const [status, setStatus] = useState<PublisherStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)

  const publisher = useMemo(() => {
    const pub = createCameraPublisher((action) => {
      dispatch(action)
      setStatus(pub.getStatus())
      setStream(pub.getStream())
    })
    return pub
  }, [dispatch])

  const start = useCallback(async () => {
    await publisher.start()
    setStatus(publisher.getStatus())
    setStream(publisher.getStream())
  }, [publisher])

  const stop = useCallback(() => {
    publisher.stop()
    setStatus(publisher.getStatus())
    setStream(publisher.getStream())
  }, [publisher])

  const handleAnswer = useCallback(async (answer: CameraAnswerPayload) => {
    await publisher.handleAnswer(answer)
    setStatus(publisher.getStatus())
  }, [publisher])

  const handleIce = useCallback(async (ice: CameraIcePayload) => {
    await publisher.handleIce(ice)
  }, [publisher])

  return { status, stream, start, stop, handleAnswer, handleIce }
}
