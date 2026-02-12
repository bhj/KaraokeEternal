// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createCameraSubscriber,
  type CameraSubscriber,
} from './useCameraSubscriber'

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: RTCSessionDescription | null = null
  remoteDescription: RTCSessionDescription | null = null
  onicecandidate: ((ev: { candidate: RTCIceCandidate | null }) => void) | null = null
  ontrack: ((ev: { streams: MediaStream[], track: MediaStreamTrack }) => void) | null = null
  connectionState = 'new'

  createAnswer = vi.fn().mockResolvedValue({
    type: 'answer' as RTCSdpType,
    sdp: 'mock-answer-sdp',
  })

  setLocalDescription = vi.fn().mockImplementation(async (desc) => {
    this.localDescription = desc as RTCSessionDescription
  })

  setRemoteDescription = vi.fn().mockImplementation(async (desc) => {
    this.remoteDescription = desc as RTCSessionDescription
  })

  addIceCandidate = vi.fn().mockResolvedValue(undefined)

  close = vi.fn()
}

const videoListeners = new Map<string, Set<(event: Event) => void>>()

function registerVideoListener (eventName: string, handler: EventListenerOrEventListenerObject) {
  const listeners = videoListeners.get(eventName) ?? new Set<(event: Event) => void>()
  const normalized = typeof handler === 'function'
    ? handler
    : (event: Event) => handler.handleEvent(event)
  listeners.add(normalized)
  videoListeners.set(eventName, listeners)
}

function unregisterVideoListener (eventName: string, handler: EventListenerOrEventListenerObject) {
  const listeners = videoListeners.get(eventName)
  if (!listeners) return
  const normalized = typeof handler === 'function'
    ? handler
    : (event: Event) => handler.handleEvent(event)
  listeners.delete(normalized)
}

// Mock video element
const mockVideoEl = {
  autoplay: false,
  playsInline: false,
  muted: false,
  defaultMuted: false,
  paused: false,
  srcObject: null as MediaStream | null,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  setAttribute: vi.fn(),
  addEventListener: vi.fn((eventName: string, handler: EventListenerOrEventListenerObject) => {
    registerVideoListener(eventName, handler)
  }),
  removeEventListener: vi.fn((eventName: string, handler: EventListenerOrEventListenerObject) => {
    unregisterVideoListener(eventName, handler)
  }),
  dispatchEvent: vi.fn((event: Event) => {
    const listeners = videoListeners.get(event.type)
    if (!listeners) return true
    for (const listener of listeners) {
      listener(event)
    }
    return true
  }),
} as unknown as HTMLVideoElement

function setupGlobals () {
  const mockPc = new MockRTCPeerConnection()
  vi.stubGlobal('RTCPeerConnection', function RTCPeerConnection () {
    return mockPc
  })
  vi.stubGlobal('RTCSessionDescription', function RTCSessionDescription (desc: unknown) {
    return desc
  })
  vi.stubGlobal('RTCIceCandidate', function RTCIceCandidate (desc: unknown) {
    return desc
  })

  // Mock document.createElement for the hidden video element
  const origCreateElement = globalThis.document?.createElement
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'video') return mockVideoEl as unknown as HTMLVideoElement
    return origCreateElement?.call(document, tag) as HTMLElement
  })

  return { mockPc }
}

describe('createCameraSubscriber', () => {
  let mocks: ReturnType<typeof setupGlobals>
  let dispatch: ReturnType<typeof vi.fn<(action: unknown) => void>>
  let subscriber: CameraSubscriber

  beforeEach(() => {
    mocks = setupGlobals()
    dispatch = vi.fn()
    subscriber = createCameraSubscriber(dispatch)
    mockVideoEl.srcObject = null
    ;(mockVideoEl.play as ReturnType<typeof vi.fn>).mockClear()
    ;(mockVideoEl.pause as ReturnType<typeof vi.fn>).mockClear()
    ;(mockVideoEl.addEventListener as ReturnType<typeof vi.fn>).mockClear()
    ;(mockVideoEl.removeEventListener as ReturnType<typeof vi.fn>).mockClear()
    ;(mockVideoEl.setAttribute as ReturnType<typeof vi.fn>).mockClear()
    videoListeners.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should start in idle status', () => {
    expect(subscriber.getStatus()).toBe('idle')
    expect(subscriber.getVideoElement()).toBeNull()
  })

  it('should create peer connection and set remote description on offer', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    expect(mocks.mockPc.setRemoteDescription).toHaveBeenCalledWith({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })
    expect(mocks.mockPc.createAnswer).toHaveBeenCalled()
    expect(mocks.mockPc.setLocalDescription).toHaveBeenCalled()
    expect(subscriber.getStatus()).toBe('connecting')
  })

  it('should dispatch CAMERA_ANSWER_REQ with SDP', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'server/CAMERA_ANSWER',
      payload: { sdp: 'mock-answer-sdp', type: 'answer' },
    })
  })

  it('should dispatch ICE candidates', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    const candidate = {
      candidate: 'candidate:1 1 udp 2122260223 192.168.1.1 12345 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0,
    }

    mocks.mockPc.onicecandidate?.({ candidate: candidate as unknown as RTCIceCandidate })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'server/CAMERA_ICE',
      payload: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      },
    })
  })

  it('should create video element and attach stream on ontrack', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    const mockTrack = { kind: 'video', id: 'track-1' } as unknown as MediaStreamTrack
    const mockRemoteStream = { id: 'remote-stream' } as unknown as MediaStream

    mocks.mockPc.ontrack?.({
      streams: [mockRemoteStream],
      track: mockTrack,
    })

    expect(subscriber.getVideoElement()).toBe(mockVideoEl)
    expect(mockVideoEl.srcObject).toBe(mockRemoteStream)
    expect(mockVideoEl.play).toHaveBeenCalled()
    expect(subscriber.getStatus()).toBe('active')
  })

  it('retries video playback when stream pauses after ontrack', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    const mockTrack = { kind: 'video', id: 'track-3' } as unknown as MediaStreamTrack
    const mockRemoteStream = { id: 'remote-stream-3' } as unknown as MediaStream

    mocks.mockPc.ontrack?.({ streams: [mockRemoteStream], track: mockTrack })
    expect(mockVideoEl.play).toHaveBeenCalledTimes(1)

    mockVideoEl.dispatchEvent(new Event('pause'))

    expect(mockVideoEl.play).toHaveBeenCalledTimes(2)
  })

  it('should notify state changes when connection status/video state changes', async () => {
    const onStateChange = vi.fn()
    subscriber = createCameraSubscriber(dispatch, onStateChange)

    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    expect(onStateChange).toHaveBeenCalledTimes(1)
    onStateChange.mockClear()

    const mockTrack = { kind: 'video', id: 'track-2' } as unknown as MediaStreamTrack
    const mockRemoteStream = { id: 'remote-stream-2' } as unknown as MediaStream
    mocks.mockPc.ontrack?.({ streams: [mockRemoteStream], track: mockTrack })

    expect(onStateChange).toHaveBeenCalledTimes(1)
    onStateChange.mockClear()

    subscriber.stop()

    expect(onStateChange).toHaveBeenCalledTimes(1)
  })

  it('should queue remote ICE until remote description is ready', async () => {
    let resolveRemoteDescription: (() => void) | null = null
    mocks.mockPc.setRemoteDescription.mockImplementationOnce(async (desc) => {
      mocks.mockPc.remoteDescription = desc as RTCSessionDescription
      await new Promise<void>((resolve) => {
        resolveRemoteDescription = resolve
      })
    })

    const offerPromise = subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    await subscriber.handleIce({
      candidate: 'candidate:1 1 udp ...',
      sdpMid: '0',
      sdpMLineIndex: 0,
    })

    expect(mocks.mockPc.addIceCandidate).not.toHaveBeenCalled()

    resolveRemoteDescription?.()
    await offerPromise

    expect(mocks.mockPc.addIceCandidate).toHaveBeenCalled()
  })

  it('should handle remote ICE candidate', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    await subscriber.handleIce({
      candidate: 'candidate:1 1 udp ...',
      sdpMid: '0',
      sdpMLineIndex: 0,
    })

    expect(mocks.mockPc.addIceCandidate).toHaveBeenCalled()
  })

  it('should clean up on stop', async () => {
    await subscriber.handleOffer({
      sdp: 'mock-offer-sdp',
      type: 'offer',
    })

    subscriber.stop()

    expect(mocks.mockPc.close).toHaveBeenCalled()
    expect(subscriber.getStatus()).toBe('idle')
    expect(subscriber.getVideoElement()).toBeNull()
  })

  it('should handle stop when not started', () => {
    subscriber.stop()
    expect(subscriber.getStatus()).toBe('idle')
  })
})
