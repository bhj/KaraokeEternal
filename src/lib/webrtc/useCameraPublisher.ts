import { useCallback, useMemo, useState } from 'react'
import {
  CAMERA_OFFER_REQ,
  CAMERA_ICE_REQ,
  CAMERA_STOP_REQ,
} from 'shared/actionTypes'
import { STUN_SERVERS, type CameraAnswerPayload, type CameraIcePayload } from './CameraSignaling'

export type PublisherStatus = 'idle' | 'connecting' | 'active' | 'error'
export type CameraFacingMode = 'user' | 'environment'

export interface CameraStartOptions {
  facingMode?: CameraFacingMode
}

interface LegacyNavigator extends Navigator {
  getUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    failure: (err: unknown) => void,
  ) => void
  webkitGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    failure: (err: unknown) => void,
  ) => void
  mozGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    failure: (err: unknown) => void,
  ) => void
  msGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    failure: (err: unknown) => void,
  ) => void
}

const BASE_VIDEO_CONSTRAINTS = {
  width: { ideal: 640 },
  height: { ideal: 480 },
}

function buildCameraConstraints (facingMode: CameraFacingMode, includeFacingMode: boolean): MediaStreamConstraints {
  return {
    video: includeFacingMode
      ? { ...BASE_VIDEO_CONSTRAINTS, facingMode: { ideal: facingMode } }
      : { ...BASE_VIDEO_CONSTRAINTS },
    audio: false,
  }
}

function isFacingModeConstraintError (err: unknown): boolean {
  return err instanceof DOMException
    && (err.name === 'OverconstrainedError'
      || err.name === 'ConstraintNotSatisfiedError'
      || err.name === 'NotFoundError')
}

function getLegacyGetUserMedia (nav: LegacyNavigator) {
  return nav.getUserMedia
    ?? nav.webkitGetUserMedia
    ?? nav.mozGetUserMedia
    ?? nav.msGetUserMedia
}

async function requestCameraStream (facingMode: CameraFacingMode): Promise<MediaStream> {
  const constrainedRequest = buildCameraConstraints(facingMode, true)
  const fallbackRequest = buildCameraConstraints(facingMode, false)

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia(constrainedRequest)
    } catch (err) {
      if (!isFacingModeConstraintError(err)) {
        throw err
      }
      return await navigator.mediaDevices.getUserMedia(fallbackRequest)
    }
  }

  const legacyNavigator = navigator as LegacyNavigator
  const legacyGetUserMedia = getLegacyGetUserMedia(legacyNavigator)

  if (!legacyGetUserMedia) {
    throw new Error('Camera API unavailable in this browser. Open this page over HTTPS on a modern browser.')
  }

  return await new Promise<MediaStream>((resolve, reject) => {
    legacyGetUserMedia.call(legacyNavigator, constrainedRequest, resolve, reject)
  })
}

function describeCameraError (err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
      return 'Camera permission was denied. Allow camera access in Safari settings and try again.'
    }
    if (err.name === 'NotFoundError') {
      return 'No camera was found on this device.'
    }
    if (err.name === 'NotReadableError') {
      return 'Camera is busy in another app. Close other camera apps and try again.'
    }
    if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      return 'This camera mode is unavailable on your device. Try switching front/rear camera.'
    }

    return err.message || 'Unable to start camera relay.'
  }

  if (err instanceof Error) {
    return err.message
  }

  return 'Unable to start camera relay.'
}

// ---- Testable core (no React dependency) ----

export interface CameraPublisher {
  start: (options?: CameraStartOptions) => Promise<void>
  stop: () => void
  handleAnswer: (answer: CameraAnswerPayload) => Promise<void>
  handleIce: (ice: CameraIcePayload) => Promise<void>
  getStatus: () => PublisherStatus
  getStream: () => MediaStream | null
  getError: () => string | null
}

export function createCameraPublisher (dispatch: (action: unknown) => void): CameraPublisher {
  let status: PublisherStatus = 'idle'
  let stream: MediaStream | null = null
  let pc: RTCPeerConnection | null = null
  let error: string | null = null
  let hasRemoteDescription = false
  let pendingIce: CameraIcePayload[] = []

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

  const start = async (options?: CameraStartOptions) => {
    const facingMode = options?.facingMode ?? 'user'
    error = null
    hasRemoteDescription = false
    pendingIce = []

    try {
      const mediaStream = await requestCameraStream(facingMode)

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
      error = describeCameraError(err)
    }
  }

  const handleAnswer = async (answer: CameraAnswerPayload) => {
    if (!pc) return

    await pc.setRemoteDescription(new RTCSessionDescription(answer))
    hasRemoteDescription = true
    await flushPendingIce()
    status = 'active'
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

    pendingIce = []
    hasRemoteDescription = false

    dispatch({ type: CAMERA_STOP_REQ, payload: {} })
    status = 'idle'
    error = null
  }

  return {
    start,
    stop,
    handleAnswer,
    handleIce,
    getStatus: () => status,
    getStream: () => stream,
    getError: () => error,
  }
}

// ---- React hook wrapper ----

export function useCameraPublisher (dispatch: (action: unknown) => void) {
  const [status, setStatus] = useState<PublisherStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publisher = useMemo(() => {
    const pub = createCameraPublisher((action) => {
      dispatch(action)
      setStatus(pub.getStatus())
      setStream(pub.getStream())
      setError(pub.getError())
    })
    return pub
  }, [dispatch])

  const start = useCallback(async (options?: CameraStartOptions) => {
    await publisher.start(options)
    setStatus(publisher.getStatus())
    setStream(publisher.getStream())
    setError(publisher.getError())
  }, [publisher])

  const stop = useCallback(() => {
    publisher.stop()
    setStatus(publisher.getStatus())
    setStream(publisher.getStream())
    setError(publisher.getError())
  }, [publisher])

  const handleAnswer = useCallback(async (answer: CameraAnswerPayload) => {
    await publisher.handleAnswer(answer)
    setStatus(publisher.getStatus())
    setError(publisher.getError())
  }, [publisher])

  const handleIce = useCallback(async (ice: CameraIcePayload) => {
    await publisher.handleIce(ice)
  }, [publisher])

  return { status, stream, error, start, stop, handleAnswer, handleIce }
}
