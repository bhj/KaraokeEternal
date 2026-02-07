import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-rooms-router.sqlite'

// Mock AuthentikClient to avoid external calls
vi.mock('../lib/AuthentikClient.js', () => ({
  AuthentikClient: {
    cleanupRoom: vi.fn().mockResolvedValue(undefined),
    isConfigured: vi.fn().mockReturnValue(true),
  },
}))

// We need to dynamically import after database is open
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
    await db.db?.run('DELETE FROM hydraPresets')
    await db.db?.run('DELETE FROM hydraFolders')
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
      ['Test Room', 'open', now, now, '{}'],
    )
    testRoomId = insertRoom?.lastID ?? 0
  })

  describe('POST /api/rooms/:roomId/join', () => {
    it('should set keVisitedRoom cookie for standard user', async () => {
      // Import router and extract handler
      const routerModule = await import('./router.js')
      const router = routerModule.default

      // Find the join handler
      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const mockCookieSet = vi.fn()
      const ctx = {
        params: { roomId: String(testRoomId) },
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: mockCookieSet, get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
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

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId) },
        state: { user: { userId: guestUser.userId, isGuest: true, isAdmin: false } },
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403 })
    })

    it('should throw error for non-existent room', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: '99999' },
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      await expect(handler(ctx, async () => {})).rejects.toThrow()
    })

    it('should throw error for closed room', async () => {
      // Close the test room
      await db.db?.run('UPDATE rooms SET status = ? WHERE roomId = ?', ['closed', testRoomId])

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/:roomId/join' && l.methods.includes('POST'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId) },
        state: { user: { userId: testUser.userId, isGuest: false, isAdmin: false } },
        cookies: { set: vi.fn(), get: vi.fn() },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]

      await expect(handler(ctx, async () => {})).rejects.toThrow()
    })
  })

  // NOTE: Enrollment endpoint tests removed - guests now use app-managed sessions via /api/guest/join

  describe('GET /api/rooms/my - enrollment URL', () => {
    it('should use relative URL for next parameter (not absolute)', async () => {
      // Set up Authentik env vars
      const originalAuthUrl = process.env.KES_AUTHENTIK_PUBLIC_URL
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'

      // Create a room owned by the test user
      const now = Math.floor(Date.now() / 1000)
      await db.db?.run(
        'INSERT INTO rooms (name, status, ownerId, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?, ?)',
        ['User Room', 'open', testUser.userId, now, now, JSON.stringify({ invitationToken: 'test-token-2' })],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const myLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/my' && l.methods.includes('GET'))

      expect(myLayer).toBeDefined()

      const ctx = {
        user: { userId: testUser.userId, isGuest: false, isAdmin: false, name: 'testuser' },
        request: { host: 'karaoke.example.com' },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
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

  describe('PUT /api/rooms/my/prefs', () => {
    it('should allow room owner to update party preset folder prefs', async () => {
      const now = Math.floor(Date.now() / 1000)
      await db.db?.run(
        'INSERT INTO hydraFolders (name, authorUserId, authorName, sortOrder, dateCreated) VALUES (?, ?, ?, ?, ?)',
        ['Working Standards', testUser.userId, 'testuser', 0, now],
      )
      const folder = await db.db?.get('SELECT folderId FROM hydraFolders WHERE name = ?', ['Working Standards'])

      await db.db?.run(
        'INSERT INTO rooms (name, status, ownerId, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?, ?)',
        ['Owner Room', 'open', testUser.userId, now, now, JSON.stringify({ prefs: {} })],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const prefsLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/my/prefs' && l.methods.includes('PUT'))

      expect(prefsLayer).toBeDefined()

      const ctx = {
        user: { userId: testUser.userId, isGuest: false, isAdmin: false, name: 'testuser' },
        request: {
          body: {
            prefs: {
              partyPresetFolderId: folder?.folderId,
              restrictCollaboratorsToPartyPresetFolder: true,
              allowGuestOrchestrator: true,
            },
          },
        },
        io: {
          in: () => ({
            fetchSockets: async () => [],
          }),
        },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = prefsLayer!.stack[prefsLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      const row = await db.db?.get('SELECT data FROM rooms WHERE ownerId = ?', [testUser.userId])
      const roomData = JSON.parse(row?.data ?? '{}')

      expect(roomData?.prefs?.partyPresetFolderId).toBe(folder?.folderId)
      expect(roomData?.prefs?.restrictCollaboratorsToPartyPresetFolder).toBe(true)
      expect(roomData?.prefs?.allowGuestOrchestrator).toBe(true)
    })

    it('should reject guests', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const prefsLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/my/prefs' && l.methods.includes('PUT'))

      expect(prefsLayer).toBeDefined()

      const ctx = {
        user: { userId: guestUser.userId, isGuest: true, isAdmin: false, name: 'guestuser' },
        request: { body: { prefs: {} } },
        io: { in: () => ({ fetchSockets: async () => [] }) },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = prefsLayer!.stack[prefsLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 401 })
    })

    it('should reject unknown folder IDs', async () => {
      const now = Math.floor(Date.now() / 1000)
      await db.db?.run(
        'INSERT INTO rooms (name, status, ownerId, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?, ?)',
        ['Owner Room', 'open', testUser.userId, now, now, JSON.stringify({ prefs: {} })],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const prefsLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/my/prefs' && l.methods.includes('PUT'))

      expect(prefsLayer).toBeDefined()

      const ctx = {
        user: { userId: testUser.userId, isGuest: false, isAdmin: false, name: 'testuser' },
        request: {
          body: {
            prefs: {
              partyPresetFolderId: 999999,
              restrictCollaboratorsToPartyPresetFolder: true,
            },
          },
        },
        io: { in: () => ({ fetchSockets: async () => [] }) },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = prefsLayer!.stack[prefsLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 422 })
    })
  })

  describe('POST /api/rooms/leave', () => {
    it('should clear keVisitedRoom cookie', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const leaveLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
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
        [JSON.stringify({ invitationToken: validInviteCode }), testRoomId],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
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
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
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
        [JSON.stringify({ invitationToken: validInviteCode }), testRoomId],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: wrongInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403, message: 'Invalid invite code' })
    })

    it('should return 403 for room without invitation token', async () => {
      // Room exists but has no invitationToken in data
      await db.db?.run(
        'UPDATE rooms SET data = ? WHERE roomId = ?',
        [JSON.stringify({}), testRoomId],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403, message: 'Invalid invite code' })
    })

    it('should return 404 for logged-in user with non-existent room', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: '99999', inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 404 })
    })

    it('should redirect to app landing page for unauthenticated user', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
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
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // Should redirect to app landing page with itoken and guest_name parameters
      expect(redirectUrl).toBeDefined()
      expect(redirectUrl).toContain(`/join?itoken=${validInviteCode}`)
      expect(redirectUrl).toContain('guest_name=')

      // Parse URL to verify guest_name format (ColorAnimal, capitalized)
      const url = new URL(redirectUrl!, 'http://localhost')
      const guestName = url.searchParams.get('guest_name')
      expect(guestName).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+$/)
    })

    it('should return 400 for invalid room ID format', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: 'not-a-number', inviteCode: validInviteCode },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for invalid invite code format', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const joinLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/:roomId/:inviteCode' && l.methods.includes('GET'))

      expect(joinLayer).toBeDefined()

      const ctx = {
        params: { roomId: String(testRoomId), inviteCode: 'invalid-code' },
        user: { userId: testUser.userId, name: 'testuser', isGuest: false, isAdmin: false },
        cookies: { set: vi.fn(), get: vi.fn() },
        status: 200 as number,
        body: undefined as unknown,
        redirect: vi.fn(),
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = joinLayer!.stack[joinLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })
  })

  // Guest join tests moved to server/Guest/router.test.ts

  describe('GET /api/rooms/join/validate - Token Validation', () => {
    const validToken = '12345678-1234-1234-1234-123456789012'

    it('should return room info for valid token', async () => {
      // Add invitation token to room data
      await db.db?.run(
        'UPDATE rooms SET data = ? WHERE roomId = ?',
        [JSON.stringify({ invitationToken: validToken }), testRoomId],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const validateLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/validate' && l.methods.includes('GET'))

      expect(validateLayer).toBeDefined()

      const ctx = {
        query: { itoken: validToken },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = validateLayer!.stack[validateLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect(ctx.body).toEqual({
        roomName: 'Test Room',
        roomId: testRoomId,
      })
    })

    it('should return 400 for missing itoken', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const validateLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/validate' && l.methods.includes('GET'))

      expect(validateLayer).toBeDefined()

      const ctx = {
        query: {},
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = validateLayer!.stack[validateLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 400 for invalid token format', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const validateLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/validate' && l.methods.includes('GET'))

      expect(validateLayer).toBeDefined()

      const ctx = {
        query: { itoken: 'not-a-uuid' },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = validateLayer!.stack[validateLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
    })

    it('should return 404 for non-existent token (generic error to prevent oracle attack)', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      const validateLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/validate' && l.methods.includes('GET'))

      expect(validateLayer).toBeDefined()

      const ctx = {
        query: { itoken: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = validateLayer!.stack[validateLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 404, message: 'Invalid invitation' })
    })

    it('should return 404 for closed room', async () => {
      // Close the test room
      await db.db?.run('UPDATE rooms SET status = ?, data = ? WHERE roomId = ?',
        ['closed', JSON.stringify({ invitationToken: validToken }), testRoomId],
      )

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const validateLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/rooms/join/validate' && l.methods.includes('GET'))

      expect(validateLayer).toBeDefined()

      const ctx = {
        query: { itoken: validToken },
        body: undefined as unknown,
        throw: (status: number, message?: string) => {
          const err = new Error(message) as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = validateLayer!.stack[validateLayer!.stack.length - 1]
      await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 404 })
    })
  })
})
