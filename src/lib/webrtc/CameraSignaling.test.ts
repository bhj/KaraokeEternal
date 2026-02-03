import { describe, it, expect } from 'vitest'
import {
  isCameraOffer,
  isCameraAnswer,
  isCameraIce,
  isCameraStop,
  type CameraOfferPayload,
  type CameraAnswerPayload,
  type CameraIcePayload,
  type CameraStopPayload,
  STUN_SERVERS,
} from './CameraSignaling'

describe('CameraSignaling', () => {
  describe('isCameraOffer', () => {
    it('should accept a valid offer payload', () => {
      const payload: CameraOfferPayload = {
        sdp: 'v=0\r\no=- 123 456 IN IP4 0.0.0.0\r\n...',
        type: 'offer',
      }
      expect(isCameraOffer(payload)).toBe(true)
    })

    it('should reject missing sdp', () => {
      expect(isCameraOffer({ type: 'offer' })).toBe(false)
    })

    it('should reject wrong type', () => {
      expect(isCameraOffer({ sdp: 'v=0...', type: 'answer' })).toBe(false)
    })

    it('should reject non-object', () => {
      expect(isCameraOffer(null)).toBe(false)
      expect(isCameraOffer('offer')).toBe(false)
      expect(isCameraOffer(42)).toBe(false)
    })
  })

  describe('isCameraAnswer', () => {
    it('should accept a valid answer payload', () => {
      const payload: CameraAnswerPayload = {
        sdp: 'v=0\r\n...',
        type: 'answer',
      }
      expect(isCameraAnswer(payload)).toBe(true)
    })

    it('should reject wrong type', () => {
      expect(isCameraAnswer({ sdp: 'v=0...', type: 'offer' })).toBe(false)
    })

    it('should reject non-object', () => {
      expect(isCameraAnswer(undefined)).toBe(false)
    })
  })

  describe('isCameraIce', () => {
    it('should accept a valid ICE candidate payload', () => {
      const payload: CameraIcePayload = {
        candidate: 'candidate:1 1 udp 2122260223 192.168.1.1 12345 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      }
      expect(isCameraIce(payload)).toBe(true)
    })

    it('should accept null candidate (end-of-candidates)', () => {
      const payload: CameraIcePayload = {
        candidate: null,
        sdpMid: null,
        sdpMLineIndex: null,
      }
      expect(isCameraIce(payload)).toBe(true)
    })

    it('should reject missing candidate field', () => {
      expect(isCameraIce({ sdpMid: '0' })).toBe(false)
    })

    it('should reject non-object', () => {
      expect(isCameraIce(123)).toBe(false)
    })
  })

  describe('isCameraStop', () => {
    it('should accept an empty stop payload', () => {
      const payload: CameraStopPayload = {}
      expect(isCameraStop(payload)).toBe(true)
    })

    it('should accept stop with reason', () => {
      expect(isCameraStop({ reason: 'user-cancelled' })).toBe(true)
    })

    it('should reject non-object', () => {
      expect(isCameraStop(null)).toBe(false)
      expect(isCameraStop('stop')).toBe(false)
    })
  })

  describe('STUN_SERVERS', () => {
    it('should contain at least one STUN server', () => {
      expect(STUN_SERVERS.length).toBeGreaterThan(0)
    })

    it('should have valid stun: URLs', () => {
      for (const server of STUN_SERVERS) {
        expect(server.urls).toMatch(/^stun:/)
      }
    })
  })
})
