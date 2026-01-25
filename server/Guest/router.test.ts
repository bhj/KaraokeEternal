import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-guest-router.sqlite'

// Mock AuthentikClient to avoid external calls
vi.mock('../lib/AuthentikClient.js', () => ({
  AuthentikClient: {
    createInvitation: vi.fn().mockResolvedValue('mock-invitation-token'),
    cleanupRoom: vi.fn().mockResolvedValue(undefined),
    isConfigured: vi.fn().mockReturnValue(true),
    getOrCreateInvitation: vi.fn().mockResolvedValue('mock-invitation-token'),
  },
}))

// We need to dynamically import after database is open
let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default

describe('Guest Router - App-Managed Guest Sessions', () => {
  let testRoomId: number
  const validToken = '12345678-1234-1234-1234-123456789012'

  beforeAll(async () => {
    // Remove any existing test database
    await fse.remove(TEST_DB_PATH)

    // Open fresh test database with migrations FIRST
    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    // NOW import modules (after db is initialized)
    const UserModule = await import('../User/User.js')
    User = UserModule.default
  })

  afterAll(async () => {
    const Database = await import('../lib/Database.js')
    await Database.close()
    await fse.remove(TEST_DB_PATH)
  })

  beforeEach(async () => {
    // Clean up between tests
    await db.db?.run('DELETE FROM rooms')
    await db.db?.run('DELETE FROM users')

    // Create a test room (open status) with invitation token
    const now = Math.floor(Date.now() / 1000)
    const insertRoom = await db.db?.run(
      'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
      ['Test Room', 'open', now, now, JSON.stringify({ invitationToken: validToken })],
    )
    testRoomId = insertRoom?.lastID ?? 0
  })

  describe('POST /api/guest/join', () => {
    it('should create guest user and set JWT cookie on valid request', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      // Debug: log router structure
      console.log('Router opts:', router.opts)
      console.log('Stack length:', router.stack.length)
      router.stack.forEach((layer: { path: string; methods: string[] }, i: number) => {
        console.log(`Layer ${i}: path=${layer.path}, methods=${JSON.stringify(layer.methods)}`)
      })

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const mockCookieSet = vi.fn()
      const ctx = {
        request: {
          body: {
            roomId: testRoomId,
            inviteCode: validToken,
            guestName: 'TestGuest',
          },
          socket: { remoteAddress: '192.168.1.1' },
        },
        ip: '192.168.1.1',
        cookies: { set: mockCookieSet, get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
        jwtKey: 'test-jwt-key',
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect(ctx.body).toEqual({ success: true })
      expect(mockCookieSet).toHaveBeenCalledWith('keToken', expect.any(String), {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      })
    })

    it('should return 400 for missing required fields', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const ctx = {
        request: {
          body: { roomId: testRoomId }, // Missing inviteCode and guestName
          socket: { remoteAddress: '192.168.1.1' },
        },
        ip: '192.168.1.1',
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
        jwtKey: 'test-jwt-key',
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for invalid invite code format', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const ctx = {
        request: {
          body: {
            roomId: testRoomId,
            inviteCode: 'not-a-uuid',
            guestName: 'TestGuest',
          },
          socket: { remoteAddress: '192.168.1.2' },
        },
        ip: '192.168.1.2',
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
        jwtKey: 'test-jwt-key',
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for wrong invite code', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const ctx = {
        request: {
          body: {
            roomId: testRoomId,
            inviteCode: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', // Valid UUID but wrong
            guestName: 'TestGuest',
          },
          socket: { remoteAddress: '192.168.1.3' },
        },
        ip: '192.168.1.3',
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
        jwtKey: 'test-jwt-key',
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for non-existent room', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const ctx = {
        request: {
          body: {
            roomId: 99999,
            inviteCode: validToken,
            guestName: 'TestGuest',
          },
          socket: { remoteAddress: '192.168.1.4' },
        },
        ip: '192.168.1.4',
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
        jwtKey: 'test-jwt-key',
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for closed room', async () => {
      // Close the test room
      await db.db?.run('UPDATE rooms SET status = ? WHERE roomId = ?', ['closed', testRoomId])

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const ctx = {
        request: {
          body: {
            roomId: testRoomId,
            inviteCode: validToken,
            guestName: 'TestGuest',
          },
          socket: { remoteAddress: '192.168.1.5' },
        },
        ip: '192.168.1.5',
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
        jwtKey: 'test-jwt-key',
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 429 when rate limited', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = router.stack.find(
        (l: { path: string; methods: string[] }) => l.path === '/api/guest/join' && l.methods.includes('POST'),
      )

      expect(joinLayer).toBeDefined()

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      // Make many requests from same IP to trigger rate limit
      const rateLimitIP = '192.168.99.99'
      let rateLimited = false

      for (let i = 0; i < 15; i++) {
        const ctx = {
          request: {
            body: {
              roomId: testRoomId,
              inviteCode: validToken,
              guestName: `Guest${i}`,
            },
            socket: { remoteAddress: rateLimitIP },
          },
          ip: rateLimitIP,
          cookies: { set: vi.fn(), get: vi.fn() },
          body: undefined as unknown,
          throw: (status: number, message?: string) => {
            const err = new Error(message) as Error & { status: number }
            err.status = status
            throw err
          },
          jwtKey: 'test-jwt-key',
        }

        try {
          await handler(ctx, async () => {})
        } catch (err) {
          if ((err as Error & { status: number }).status === 429) {
            rateLimited = true
            break
          }
        }
      }

      expect(rateLimited).toBe(true)
    })
  })
})
