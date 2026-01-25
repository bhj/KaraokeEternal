import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the logger before importing AuthentikClient
vi.mock('./Log.js', () => ({
  default: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    verbose: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Store original env vars
const originalEnv: Record<string, string | undefined> = {}

describe('AuthentikClient', () => {
  beforeEach(() => {
    // Save original env vars
    originalEnv.KES_AUTHENTIK_URL = process.env.KES_AUTHENTIK_URL
    originalEnv.KES_AUTHENTIK_API_TOKEN = process.env.KES_AUTHENTIK_API_TOKEN
    originalEnv.KES_AUTHENTIK_ENROLLMENT_FLOW = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW

    // Set test env vars
    process.env.KES_AUTHENTIK_URL = 'http://localhost:9000'
    process.env.KES_AUTHENTIK_API_TOKEN = 'test-token'
    process.env.KES_AUTHENTIK_ENROLLMENT_FLOW = 'karaoke-guest-enrollment'

    // Reset module cache to pick up new env vars
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original env vars
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    })
    vi.restoreAllMocks()
  })

  describe('getInvitation', () => {
    it('should return invitation data when invitation exists', async () => {
      const mockInvitationPk = '12345678-1234-1234-1234-123456789012'
      const mockInvitationData = {
        pk: mockInvitationPk,
        name: 'karaoke-room-1-1234567890',
        expires: '2026-01-26T00:00:00Z',
        fixed_data: { karaoke_room_id: '1' },
      }

      // Mock fetch for invitation lookup
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvitationData,
      } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getInvitation(mockInvitationPk)

      expect(fetchSpy).toHaveBeenCalledWith(
        `http://localhost:9000/api/v3/stages/invitation/invitations/${mockInvitationPk}/`,
        { headers: { Authorization: 'Bearer test-token' } },
      )
      expect(result).toEqual(mockInvitationData)
    })

    it('should return null when invitation does not exist', async () => {
      const mockInvitationPk = 'nonexistent-token'

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getInvitation(mockInvitationPk)

      expect(result).toBeNull()
    })

    it('should return null when Authentik is not configured', async () => {
      delete process.env.KES_AUTHENTIK_URL
      vi.resetModules()

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getInvitation('any-token')

      expect(result).toBeNull()
    })
  })

  describe('getOrCreateInvitation', () => {
    it('should return existing valid invitation token from room data', async () => {
      const roomId = 1
      const existingToken = '12345678-1234-1234-1234-123456789012'

      // Mock: invitation exists and is valid
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pk: existingToken,
          expires: '2026-01-26T00:00:00Z',
        }),
      } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getOrCreateInvitation(roomId, existingToken)

      expect(result).toBe(existingToken)
      expect(fetchSpy).toHaveBeenCalledTimes(1) // Only checked, didn't create
    })

    it('should create new invitation when existing token is invalid/expired', async () => {
      const roomId = 1
      const expiredToken = 'expired-token-uuid'
      const newToken = 'new-valid-token-uuid'

      const fetchSpy = vi.spyOn(global, 'fetch')
        // First call: check existing invitation - returns 404 (not found/expired)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response)
        // Second call: get flow pk
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ pk: 'flow-pk-uuid' }] }),
        } as Response)
        // Third call: create new invitation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pk: newToken }),
        } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getOrCreateInvitation(roomId, expiredToken)

      expect(result).toBe(newToken)
      expect(fetchSpy).toHaveBeenCalledTimes(3)
    })

    it('should create new invitation when no existing token provided', async () => {
      const roomId = 1
      const newToken = 'brand-new-token-uuid'

      const fetchSpy = vi.spyOn(global, 'fetch')
        // First call: get flow pk
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ pk: 'flow-pk-uuid' }] }),
        } as Response)
        // Second call: create new invitation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pk: newToken }),
        } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getOrCreateInvitation(roomId, null)

      expect(result).toBe(newToken)
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('should return null when Authentik is not configured', async () => {
      delete process.env.KES_AUTHENTIK_URL
      vi.resetModules()

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getOrCreateInvitation(1, null)

      expect(result).toBeNull()
    })

    it('should return null when invitation creation fails', async () => {
      const roomId = 1

      vi.spyOn(global, 'fetch')
        // First call: get flow pk
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [{ pk: 'flow-pk-uuid' }] }),
        } as Response)
        // Second call: create invitation fails
        .mockResolvedValueOnce({
          ok: false,
          text: async () => 'API Error',
        } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      const result = await AuthentikClient.getOrCreateInvitation(roomId, null)

      expect(result).toBeNull()
    })
  })
})
