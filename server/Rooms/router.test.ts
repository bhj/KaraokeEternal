import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-rooms-router.sqlite'

// Mock AuthentikClient to avoid external calls
vi.mock('../lib/AuthentikClient.js', () => ({
  AuthentikClient: {
    createInvitation: vi.fn().mockResolvedValue('mock-invitation-token'),
    cleanupRoom: vi.fn().mockResolvedValue(undefined),
  },
}))

// We need to dynamically import after database is open
let Rooms: typeof import('./Rooms.js').default
let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default

describe('Rooms Router - Room Joining', () => {
  let testRoomId: number
  let testUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let guestUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>

  beforeAll(async () => {
    // Remove any existing test database
    await fse.remove(TEST_DB_PATH)

    // Open fresh test database with migrations FIRST
    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    // NOW import modules (after db is initialized)
    const RoomsModule = await import('./Rooms.js')
    Rooms = RoomsModule.default

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
    await db.db?.run('DELETE FROM queue')
    await db.db?.run('DELETE FROM users')

    // Create test users
    testUser = await User.getOrCreateFromHeader('testuser', false, false)
    guestUser = await User.getOrCreateFromHeader('guestuser', false, true)

    // Create a test room (open status)
    const now = Math.floor(Date.now() / 1000)
    const insertRoom = await db.db?.run(
      'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
      ['Test Room', 'open', now, now, '{}']
    )
    testRoomId = insertRoom?.lastID ?? 0
  })

  describe('POST /api/rooms/:roomId/join', () => {
    it('should set keVisitedRoom cookie for standard user', async () => {
      // Import router and extract handler
      const routerModule = await import('./router.js')
      const router = routerModule.default

      // Find the join handler
      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const mockCookieSet = vi.fn()
      const ctx = {
        params: { roomId: String(testRoomId) },
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: mockCookieSet, get: vi.fn() },
        body: undefined as unknown,
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect(ctx.body).toEqual({ success: true })
      expect(mockCookieSet).toHaveBeenCalledWith('keVisitedRoom', String(testRoomId), {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // false in test environment (not production/proxy)
        maxAge: 24 * 60 * 60 * 1000,
      })
    })

    it('should return 403 for guest users', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId) },
        state: { user: { userId: guestUser.userId, isGuest: true, isAdmin: false } },
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403 })
    })

    it('should throw error for non-existent room', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: '99999' },
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      await expect(handler(ctx, async () => {})).rejects.toThrow()
    })

    it('should throw error for closed room', async () => {
      // Close the test room
      await db.db?.run('UPDATE rooms SET status = ? WHERE roomId = ?', ['closed', testRoomId])

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId) },
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      await expect(handler(ctx, async () => {})).rejects.toThrow()
    })
  })

  describe('GET /api/rooms/:roomId/enrollment', () => {
    it('should use relative URL for next parameter (not absolute)', async () => {
      // Set up Authentik env vars
      const originalAuthUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'

      // Add invitation token to room data
      await db.db?.run(
        'UPDATE rooms SET data = ? WHERE roomId = ?',
        [JSON.stringify({ invitationToken: 'test-token' }), testRoomId]
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const enrollmentLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/enrollment' && l.methods.includes('GET'))

      expect(enrollmentLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId) },
        request: { host: 'karaoke.example.com' },
        body: undefined as unknown,
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = enrollmentLayer!.stack[enrollmentLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // Parse the enrollment URL and check the next parameter
      const enrollmentUrl = new URL((ctx.body as { enrollmentUrl: string }).enrollmentUrl)
      const nextParam = enrollmentUrl.searchParams.get('next')

      // next should be a relative URL, not absolute
      // Authentik rejects absolute URLs as open redirect protection
      expect(nextParam).toBe('/')

      // Restore env
      if (originalAuthUrl !== undefined) {
        process.env.KES_AUTHENTIK_PUBLIC_URL = originalAuthUrl
      } else {
        delete process.env.KES_AUTHENTIK_PUBLIC_URL
      }
    })
  })

  describe('GET /api/rooms/my - enrollment URL', () => {
    it('should use relative URL for next parameter (not absolute)', async () => {
      // Set up Authentik env vars
      const originalAuthUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'

      // Create a room owned by the test user
      const now = Math.floor(Date.now() / 1000)
      const insertRoom = await db.db?.run(
        'INSERT INTO rooms (name, status, ownerId, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?, ?)',
        ['User Room', 'open', testUser.userId, now, now, JSON.stringify({ invitationToken: 'test-token-2' })]
      )
      const userRoomId = insertRoom?.lastID ?? 0

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const myLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/my' && l.methods.includes('GET'))

      expect(myLayer).toBeDefined()

      const ctx = {
        user: { userId: testUser.userId, isGuest: false, isAdmin: false, name: 'testuser' },
        request: { host: 'karaoke.example.com' },
        body: undefined as unknown,
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = myLayer!.stack[myLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // Parse the enrollment URL and check the next parameter
      const responseBody = ctx.body as { room: { enrollmentUrl: string } }
      const enrollmentUrl = new URL(responseBody.room.enrollmentUrl)
      const nextParam = enrollmentUrl.searchParams.get('next')

      // next should be a relative URL, not absolute
      // Authentik rejects absolute URLs as open redirect protection
      expect(nextParam).toBe('/')

      // Restore env
      if (originalAuthUrl !== undefined) {
        process.env.KES_AUTHENTIK_PUBLIC_URL = originalAuthUrl
      } else {
        delete process.env.KES_AUTHENTIK_PUBLIC_URL
      }
    })
  })

  describe('POST /api/rooms/leave', () => {
    it('should clear keVisitedRoom cookie', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const leaveLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/leave' && l.methods.includes('POST'))

      expect(leaveLayer).toBeDefined()

      const mockCookieSet = vi.fn()
      const ctx = {
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: mockCookieSet, get: vi.fn() },
        body: undefined as unknown,
      }

      const handler = leaveLayer!.stack[leaveLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect(ctx.body).toEqual({ success: true })
      expect(mockCookieSet).toHaveBeenCalledWith('keVisitedRoom', '', { maxAge: 0 })
    })
  })

  describe('GET /api/rooms/join/:roomId/:inviteCode - Smart QR Entry', () => {
    const validInviteCode = '12345678-1234-1234-1234-123456789012'
    const wrongInviteCode = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

    it('should set cookie and redirect to / for logged-in user with valid invite code', async () => {
      // Set up room with matching invitation token
      await db.db?.run(
        'UPDATE rooms SET data = ? WHERE roomId = ?',
        [JSON.stringify({ invitationToken: validInviteCode }), testRoomId]
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const mockCookieSet = vi.fn()
      let redirectUrl: string | undefined
      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: mockCookieSet, get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: (url: string) => { redirectUrl = url },
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect(mockCookieSet).toHaveBeenCalledWith('keVisitedRoom', String(testRoomId), {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      })
      expect(redirectUrl).toBe('/')
    })

    it('should return 403 for logged-in user with wrong invite code', async () => {
      // Room has token X, user provides token Y
      await db.db?.run(
        'UPDATE rooms SET data = ? WHERE roomId = ?',
        [JSON.stringify({ invitationToken: validInviteCode }), testRoomId]
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: wrongInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403, message: 'Invalid invite code' })
    })

    it('should return 403 for room without invitation token', async () => {
      // Room exists but has no invitationToken in data
      await db.db?.run(
        'UPDATE rooms SET data = ? WHERE roomId = ?',
        [JSON.stringify({}), testRoomId]
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403, message: 'Invalid invite code' })
    })

    it('should return 404 for logged-in user with non-existent room', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: '99999', inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 404 })
    })

    it('should redirect to Authentik enrollment for unauthenticated user', async () => {
      const originalAuthUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
      const originalEnrollmentFlow = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'
      process.env.KES_AUTHENTIK_ENROLLMENT_FLOW = 'karaoke-unified'

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      let redirectUrl: string | undefined
      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: validInviteCode },
        user: { userId: null, username: null, isAdmin: false, isGuest: false }, // Realistic unauthenticated context
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: (url: string) => { redirectUrl = url },
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // URL should contain itoken and guest_name parameters
      expect(redirectUrl).toBeDefined()
      expect(redirectUrl).toContain('https://auth.example.com/if/flow/karaoke-unified/')
      expect(redirectUrl).toContain(`itoken=${validInviteCode}`)
      expect(redirectUrl).toContain('guest_name=')

      // Restore env
      if (originalAuthUrl !== undefined) {
        process.env.KES_AUTHENTIK_PUBLIC_URL = originalAuthUrl
      } else {
        delete process.env.KES_AUTHENTIK_PUBLIC_URL
      }
      if (originalEnrollmentFlow !== undefined) {
        process.env.KES_AUTHENTIK_ENROLLMENT_FLOW = originalEnrollmentFlow
      } else {
        delete process.env.KES_AUTHENTIK_ENROLLMENT_FLOW
      }
    })

    it('should return 400 for invalid room ID format', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: 'not-a-number', inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for invalid invite code format', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: 'invalid-code' },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 500 when SSO not configured for unauthenticated user', async () => {
      const originalAuthUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
      delete process.env.KES_AUTHENTIK_PUBLIC_URL

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: validInviteCode },
        user: { userId: null, username: null, isAdmin: false, isGuest: false }, // Realistic unauthenticated context
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 500 })

      // Restore env
      if (originalAuthUrl !== undefined) {
        process.env.KES_AUTHENTIK_PUBLIC_URL = originalAuthUrl
      }
    })

    it('should include guest_name parameter in Authentik enrollment URL for unauthenticated user', async () => {
      const originalAuthUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
      const originalEnrollmentFlow = process.env.KES_AUTHENTIK_ENROLLMENT_FLOW
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'
      process.env.KES_AUTHENTIK_ENROLLMENT_FLOW = 'karaoke-unified'

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string; methods: string[]; stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      let redirectUrl: string | undefined
      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: validInviteCode },
        user: { userId: null, username: null, isAdmin: false, isGuest: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: (url: string) => { redirectUrl = url },
        throw: ((status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        }),
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // Parse redirect URL
      expect(redirectUrl).toBeDefined()
      const url = new URL(redirectUrl!)

      // Should have itoken parameter
      expect(url.searchParams.get('itoken')).toBe(validInviteCode)

      // Should have guest_name parameter with a generated name (Color + Animal, capitalized)
      const guestName = url.searchParams.get('guest_name')
      expect(guestName).toBeDefined()
      expect(guestName).not.toBe('')
      // Name should be two capitalized words (e.g., "RedPenguin", "BlueDolphin")
      expect(guestName).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+$/)

      // Restore env
      if (originalAuthUrl !== undefined) {
        process.env.KES_AUTHENTIK_PUBLIC_URL = originalAuthUrl
      } else {
        delete process.env.KES_AUTHENTIK_PUBLIC_URL
      }
      if (originalEnrollmentFlow !== undefined) {
        process.env.KES_AUTHENTIK_ENROLLMENT_FLOW = originalEnrollmentFlow
      } else {
        delete process.env.KES_AUTHENTIK_ENROLLMENT_FLOW
      }
    })
  })
})
