import { useCallback, useMemo, useState } from 'react'
import {
  CAMERA_ANSWER_REQ,
  CAMERA_ICE_REQ,
} from 'shared/actionTypes'
import { STUN_SERVERS, type CameraOfferPayload, type CameraIcePayload } from './CameraSignaling'

export type SubscriberStatus = 'idle' | 'connecting' | 'active'

const debug = (...args: unknown[]) => console.debug('[CameraSubscriber]', ...args)

function videoDiagSnapshot (videoEl: HTMLVideoElement | null) {
  if (!videoEl) return null
  return {
    readyState: videoEl.readyState,
    networkState: videoEl.networkState,
    paused: videoEl.paused,
    muted: videoEl.muted,
    videoWidth: videoEl.videoWidth,
    videoHeight: videoEl.videoHeight,
    hasSrcObject: videoEl.srcObject !== null,
  }
}

function attachVideoDiagnostics (videoEl: HTMLVideoElement) {
  if (typeof videoEl.addEventListener !== 'function') return

  const events = ['loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'ended', 'error'] as const
  for (const eventName of events) {
    videoEl.addEventListener(eventName, () => {
      debug(`video event=${eventName}`, videoDiagSnapshot(videoEl))
    })
  }
}

function attemptVideoPlay (videoEl: HTMLVideoElement, reason: string) {
  if (!videoEl.srcObject) {
    debug('skip video play (no srcObject)', { reason, video: videoDiagSnapshot(videoEl) })
    return
  }

  const playResult = videoEl.play?.()
  if (playResult && typeof playResult.catch === 'function') {
    playResult.catch((err: unknown): void => {
      console.debug('[CameraSubscriber] remote video play() failed', {
        reason,
        err,
        video: videoDiagSnapshot(videoEl),
      })
    })
  }
}

function attachPlaybackKeepAlive (videoEl: HTMLVideoElement): () => void {
  if (typeof videoEl.addEventListener !== 'function' || typeof videoEl.removeEventListener !== 'function') {
    return () => {}
  }

  const replayEvents = ['loadedmetadata', 'canplay', 'pause', 'waiting', 'stalled'] as const
  const handlers = replayEvents.map((eventName) => {
    const handler = () => {
      attemptVideoPlay(videoEl, `event:${eventName}`)
    }
    videoEl.addEventListener(eventName, handler)
    return { eventName, handler }
  })

  return () => {
    for (const { eventName, handler } of handlers) {
      videoEl.removeEventListener(eventName, handler)
    }
  }
}

function configureVideoElement (videoEl: HTMLVideoElement) {
  videoEl.autoplay = true
  videoEl.playsInline = true
  videoEl.muted = true
  videoEl.defaultMuted = true
  if (typeof videoEl.setAttribute === 'function') {
    videoEl.setAttribute('autoplay', '')
    videoEl.setAttribute('playsinline', '')
    videoEl.setAttribute('muted', '')
  }
}

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
  let detachPlaybackKeepAlive: (() => void) | null = null
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

    debug('flushing pending ICE', { count: queued.length })

    for (const ice of queued) {
      await addIceCandidate(ice)
    }
  }

  const handleOffer = async (offer: CameraOfferPayload) => {
    debug('handleOffer', {
      hasExistingPeer: Boolean(pc),
      sdpLength: typeof offer.sdp === 'string' ? offer.sdp.length : 0,
    })

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
        debug('local ICE candidate generated', {
          hasCandidate: Boolean(ev.candidate.candidate),
          sdpMid: ev.candidate.sdpMid,
          sdpMLineIndex: ev.candidate.sdpMLineIndex,
        })

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
      debug('ontrack received', {
        streamCount: ev.streams.length,
        trackKind: ev.track?.kind,
        trackId: ev.track?.id,
      })

      if (!videoEl) {
        videoEl = document.createElement('video')
        configureVideoElement(videoEl)
        attachVideoDiagnostics(videoEl)
        detachPlaybackKeepAlive = attachPlaybackKeepAlive(videoEl)
      }

      videoEl.srcObject = ev.streams[0] ?? new MediaStream([ev.track])
      debug('video srcObject assigned', videoDiagSnapshot(videoEl))
      attemptVideoPlay(videoEl, 'ontrack')

      status = 'active'
      notifyStateChange()
      debug('subscriber status=active', videoDiagSnapshot(videoEl))
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    hasRemoteDescription = true
    debug('remote description set')
    await flushPendingIce()

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    debug('local answer created', {
      sdpLength: typeof answer.sdp === 'string' ? answer.sdp.length : 0,
    })

    dispatch({
      type: CAMERA_ANSWER_REQ,
      payload: { sdp: answer.sdp, type: 'answer' },
    })
  }

  const handleIce = async (ice: CameraIcePayload) => {
    if (!pc || !ice.candidate) return

    if (!hasRemoteDescription) {
      pendingIce.push(ice)
      debug('queued remote ICE before remote description', { queued: pendingIce.length })
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

    if (detachPlaybackKeepAlive) {
      detachPlaybackKeepAlive()
      detachPlaybackKeepAlive = null
    }

    debug('stop subscriber', videoDiagSnapshot(videoEl))

    if (videoEl) {
      try {
        videoEl.pause?.()
      } catch {
        // no-op cleanup guard
      }
      videoEl.srcObject = null
    }

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
      action => dispatch(action),
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
