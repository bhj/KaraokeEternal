// WebRTC camera signaling types and validators
// Used for phone→TV camera sharing via Socket.IO relay

export interface CameraOfferPayload {
  sdp: string
  type: 'offer'
}

export interface CameraAnswerPayload {
  sdp: string
  type: 'answer'
}

export interface CameraIcePayload {
  candidate: string | null
  sdpMid: string | null
  sdpMLineIndex: number | null
}

export interface CameraStopPayload {
  reason?: string
}

// Type guards for server-relayed payloads

export function isCameraOffer (payload: unknown): payload is CameraOfferPayload {
  if (typeof payload !== 'object' || payload === null) return false
  const p = payload as Record<string, unknown>
  return typeof p.sdp === 'string' && p.type === 'offer'
}

export function isCameraAnswer (payload: unknown): payload is CameraAnswerPayload {
  if (typeof payload !== 'object' || payload === null) return false
  const p = payload as Record<string, unknown>
  return typeof p.sdp === 'string' && p.type === 'answer'
}

export function isCameraIce (payload: unknown): payload is CameraIcePayload {
  if (typeof payload !== 'object' || payload === null) return false
  const p = payload as Record<string, unknown>
  return 'candidate' in p
}

export function isCameraStop (payload: unknown): payload is CameraStopPayload {
  if (typeof payload !== 'object' || payload === null) return false
  return true
}

// STUN server configuration for NAT traversal
export const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]
