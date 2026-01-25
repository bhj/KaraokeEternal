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

    // Set test env vars
    process.env.KES_AUTHENTIK_URL = 'http://localhost:9000'
    process.env.KES_AUTHENTIK_API_TOKEN = 'test-token'

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

  describe('isConfigured', () => {
    it('should return true when both URL and token are set', async () => {
      const { AuthentikClient } = await import('./AuthentikClient.js')
      expect(AuthentikClient.isConfigured()).toBe(true)
    })

    it('should return false when URL is not set', async () => {
      delete process.env.KES_AUTHENTIK_URL
      vi.resetModules()

      const { AuthentikClient } = await import('./AuthentikClient.js')
      expect(AuthentikClient.isConfigured()).toBe(false)
    })

    it('should return false when token is not set', async () => {
      delete process.env.KES_AUTHENTIK_API_TOKEN
      vi.resetModules()

      const { AuthentikClient } = await import('./AuthentikClient.js')
      expect(AuthentikClient.isConfigured()).toBe(false)
    })
  })

  describe('cleanupRoom', () => {
    it('should delete invitations for a room', async () => {
      const roomId = 1
      const mockInvitations = {
        results: [
          { pk: 'inv-1', name: 'karaoke-room-1-123' },
          { pk: 'inv-2', name: 'karaoke-room-1-456' },
        ],
      }

      const fetchSpy = vi.spyOn(global, 'fetch')
        // First call: list invitations
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockInvitations,
        } as Response)
        // Second call: delete first invitation
        .mockResolvedValueOnce({ ok: true } as Response)
        // Third call: delete second invitation
        .mockResolvedValueOnce({ ok: true } as Response)

      const { AuthentikClient } = await import('./AuthentikClient.js')
      await AuthentikClient.cleanupRoom(roomId)

      expect(fetchSpy).toHaveBeenCalledTimes(3)
      expect(fetchSpy).toHaveBeenNthCalledWith(
        1,
        'http://localhost:9000/api/v3/stages/invitation/invitations/?name__startswith=karaoke-room-1-',
        { headers: { Authorization: 'Bearer test-token' } },
      )
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        'http://localhost:9000/api/v3/stages/invitation/invitations/inv-1/',
        { method: 'DELETE', headers: { Authorization: 'Bearer test-token' } },
      )
    })

    it('should do nothing when Authentik is not configured', async () => {
      delete process.env.KES_AUTHENTIK_URL
      vi.resetModules()

      const fetchSpy = vi.spyOn(global, 'fetch')
      const { AuthentikClient } = await import('./AuthentikClient.js')

      await AuthentikClient.cleanupRoom(1)

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      const roomId = 1

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const { AuthentikClient } = await import('./AuthentikClient.js')

      // Should not throw
      await expect(AuthentikClient.cleanupRoom(roomId)).resolves.toBeUndefined()
    })
  })
})
