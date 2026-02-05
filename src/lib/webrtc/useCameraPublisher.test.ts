import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createCameraPublisher,
  type CameraPublisher,
} from './useCameraPublisher'

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: RTCSessionDescription | null = null
  remoteDescription: RTCSessionDescription | null = null
  onicecandidate: ((ev: { candidate: RTCIceCandidate | null }) => void) | null = null
  connectionState = 'new'
  _tracks: MediaStreamTrack[] = []

  createOffer = vi.fn().mockResolvedValue({
    type: 'offer' as RTCSdpType,
    sdp: 'mock-offer-sdp',
  })

  setLocalDescription = vi.fn().mockImplementation(async (desc) => {
    this.localDescription = desc as RTCSessionDescription
  })

  setRemoteDescription = vi.fn().mockImplementation(async (desc) => {
    this.remoteDescription = desc as RTCSessionDescription
  })

  addIceCandidate = vi.fn().mockResolvedValue(undefined)

  addTrack = vi.fn().mockImplementation((track: MediaStreamTrack) => {
    this._tracks.push(track)
  })

  close = vi.fn()
}

// Mock media
const mockVideoTrack = {
  kind: 'video',
  stop: vi.fn(),
  enabled: true,
  id: 'mock-video-track',
} as unknown as MediaStreamTrack

const mockStream = {
  getTracks: () => [mockVideoTrack],
  getVideoTracks: () => [mockVideoTrack],
} as unknown as MediaStream

function setupGlobals () {
  const mockPc = new MockRTCPeerConnection()
  // Use a proper constructor function (vi.fn arrow functions can't be constructors)
  vi.stubGlobal('RTCPeerConnection', function RTCPeerConnection () {
    return mockPc
  })
  vi.stubGlobal('RTCSessionDescription', function RTCSessionDescription (desc: unknown) {
    return desc
  })
  vi.stubGlobal('RTCIceCandidate', function RTCIceCandidate (desc: unknown) {
    return desc
  })

  const getUserMedia = vi.fn().mockResolvedValue(mockStream)
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    writable: true,
    configurable: true,
  })

  return { mockPc, getUserMedia }
}

describe('createCameraPublisher', () => {
  let mocks: ReturnType<typeof setupGlobals>
  let dispatch: ReturnType<typeof vi.fn<(action: unknown) => void>>
  let publisher: CameraPublisher

  beforeEach(() => {
    mocks = setupGlobals()
    dispatch = vi.fn()
    publisher = createCameraPublisher(dispatch)
    ;(mockVideoTrack.stop as ReturnType<typeof vi.fn>).mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should start in idle status', () => {
    expect(publisher.getStatus()).toBe('idle')
    expect(publisher.getStream()).toBeNull()
  })

  it('should request user media and create offer on start', async () => {
    await publisher.start()

    expect(mocks.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    expect(mocks.mockPc.addTrack).toHaveBeenCalledWith(mockVideoTrack, mockStream)
    expect(mocks.mockPc.createOffer).toHaveBeenCalled()
    expect(mocks.mockPc.setLocalDescription).toHaveBeenCalled()
    expect(publisher.getStatus()).toBe('connecting')
  })

  it('should dispatch CAMERA_OFFER_REQ with SDP', async () => {
    await publisher.start()

    expect(dispatch).toHaveBeenCalledWith({
      type: 'server/CAMERA_OFFER',
      payload: { sdp: 'mock-offer-sdp', type: 'offer' },
    })
  })

  it('should dispatch ICE candidates via onicecandidate', async () => {
    await publisher.start()

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

  it('should handle remote answer', async () => {
    await publisher.start()

    await publisher.handleAnswer({
      sdp: 'mock-answer-sdp',
      type: 'answer',
    })

    expect(mocks.mockPc.setRemoteDescription).toHaveBeenCalledWith({
      sdp: 'mock-answer-sdp',
      type: 'answer',
    })
    expect(publisher.getStatus()).toBe('active')
  })

  it('should handle remote ICE candidate', async () => {
    await publisher.start()

    await publisher.handleIce({
      candidate: 'candidate:1 1 udp ...',
      sdpMid: '0',
      sdpMLineIndex: 0,
    })

    expect(mocks.mockPc.addIceCandidate).toHaveBeenCalled()
  })

  it('should stop and clean up resources', async () => {
    await publisher.start()
    publisher.stop()

    expect(mockVideoTrack.stop).toHaveBeenCalled()
    expect(mocks.mockPc.close).toHaveBeenCalled()
    expect(publisher.getStatus()).toBe('idle')
    expect(publisher.getStream()).toBeNull()
    expect(dispatch).toHaveBeenCalledWith({
      type: 'server/CAMERA_STOP',
      payload: {},
    })
  })

  it('should handle getUserMedia failure gracefully', async () => {
    mocks.getUserMedia.mockRejectedValueOnce(new DOMException('Not allowed', 'NotAllowedError'))

    await publisher.start()

    expect(publisher.getStatus()).toBe('error')
    expect(publisher.getStream()).toBeNull()
  })

  it('should not dispatch ICE when candidate is null (end-of-candidates)', async () => {
    await publisher.start()
    dispatch.mockClear()

    mocks.mockPc.onicecandidate?.({ candidate: null as unknown as RTCIceCandidate })

    const iceDispatches = dispatch.mock.calls.filter(
      ([a]: [{ type: string }]) => a.type === 'server/CAMERA_ICE',
    )
    expect(iceDispatches).toHaveLength(0)
  })
})
