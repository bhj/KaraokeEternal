import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'
import jsonWebToken from 'jsonwebtoken'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-user-router.sqlite'

// We need to dynamically import after database is open
let User: typeof import('./User.js').default
let Rooms: typeof import('../Rooms/Rooms.js').default
let db: typeof import('../lib/Database.js').default

describe('User Router - createUserCtx', () => {
  beforeAll(async () => {
    // Remove any existing test database
    await fse.remove(TEST_DB_PATH)

    // Open fresh test database with migrations FIRST
    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    // NOW import modules (after db is initialized)
    const UserModule = await import('./User.js')
    User = UserModule.default

    const RoomsModule = await import('../Rooms/Rooms.js')
    Rooms = RoomsModule.default
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
  })

  describe('GET /api/user', () => {
    it('should include ownRoomId in response when user has an own room', async () => {
      // Create a test user
      const testUser = await User.getOrCreateFromHeader('testuser', false, false)

      // Create an ephemeral room owned by the user
      const ownRoomId = await Rooms.createEphemeral(testUser.userId, 'testuser')

      // Import router and extract handler
      const routerModule = await import('./router.js')
      const router = routerModule.default

      // Find the GET /api/user handler
      type Layer = {
        path: string
        methods: string[]
        stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
      }
      const userLayer = (router as unknown as { stack: Layer[] }).stack
        .find((l: Layer) => l.path === '/api/user' && l.methods.includes('GET'))

      expect(userLayer).toBeDefined()

      const ctx = {
        user: {
          userId: testUser.userId,
          username: testUser.username,
          roomId: ownRoomId,
          ownRoomId: ownRoomId,
          isAdmin: false,
          isGuest: false,
        },
        jwtKey: 'test-jwt-key',
        body: undefined as unknown,
        throw: (status: number) => {
          const err = new Error() as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = userLayer!.stack[userLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // The response should include ownRoomId
      expect(ctx.body).toBeDefined()
      expect((ctx.body as { ownRoomId?: number }).ownRoomId).toBe(ownRoomId)
    })

    it('should return ownRoomId as null when user has no own room', async () => {
      // Create a local user (non-SSO)
      const userId = await User.create({
        username: 'localuser',
        newPassword: 'password123',
        newPasswordConfirm: 'password123',
        name: 'Local User',
      })
      const testUser = await User.getById(userId, true)

      // Create a room that is NOT owned by the user (just a standard room)
      const now = Math.floor(Date.now() / 1000)
      const insertRoom = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Shared Room', 'open', now, now, '{}'],
      )
      const sharedRoomId = insertRoom?.lastID

      // Import router and extract handler
      const routerModule = await import('./router.js')
      const router = routerModule.default

      type Layer = {
        path: string
        methods: string[]
        stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
      }
      const userLayer = (router as unknown as { stack: Layer[] }).stack
        .find((l: Layer) => l.path === '/api/user' && l.methods.includes('GET'))

      expect(userLayer).toBeDefined()

      const ctx = {
        user: {
          userId: testUser.userId,
          username: testUser.username,
          roomId: sharedRoomId,
          ownRoomId: null, // User doesn't own a room
          isAdmin: false,
          isGuest: false,
        },
        jwtKey: 'test-jwt-key',
        body: undefined as unknown,
        throw: (status: number) => {
          const err = new Error() as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = userLayer!.stack[userLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // The response should include ownRoomId as null
      expect(ctx.body).toBeDefined()
      expect((ctx.body as { ownRoomId?: number | null }).ownRoomId).toBeNull()
    })

    it('should create an ephemeral room for SSO users without one and refresh the token', async () => {
      const { verify: jwtVerify } = jsonWebToken

      const testUser = await User.getOrCreateFromHeader('testuser', false, false)

      const routerModule = await import('./router.js')
      const router = routerModule.default

      type Layer = {
        path: string
        methods: string[]
        stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
      }
      const userLayer = (router as unknown as { stack: Layer[] }).stack
        .find((l: Layer) => l.path === '/api/user' && l.methods.includes('GET'))

      expect(userLayer).toBeDefined()

      const cookieSetCalls: Array<{ name: string, value: string, options?: { maxAge?: number } }> = []
      const ctx = {
        user: {
          userId: testUser.userId,
          username: testUser.username,
          roomId: null,
          ownRoomId: null,
          isAdmin: false,
          isGuest: false,
        },
        jwtKey: 'test-jwt-key',
        body: undefined as unknown,
        cookies: {
          set: (name: string, value: string, options?: { maxAge?: number }) => {
            cookieSetCalls.push({ name, value, options })
          },
        },
        throw: (status: number) => {
          const err = new Error() as Error & { status: number }
          err.status = status
          throw err
        },
      }

      const handler = userLayer!.stack[userLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      const ownRoom = await Rooms.getByOwnerId(testUser.userId)
      expect(ownRoom).toBeDefined()

      expect(ctx.body).toBeDefined()
      expect((ctx.body as { ownRoomId?: number }).ownRoomId).toBe(ownRoom!.roomId)
      expect((ctx.body as { roomId?: number }).roomId).toBe(ownRoom!.roomId)

      const keTokenCall = cookieSetCalls.find(c => c.name === 'keToken')
      expect(keTokenCall).toBeDefined()
      const decoded = jwtVerify(keTokenCall!.value, ctx.jwtKey) as { roomId: number, ownRoomId: number }
      expect(decoded.roomId).toBe(ownRoom!.roomId)
      expect(decoded.ownRoomId).toBe(ownRoom!.roomId)
    })
  })

  describe('POST /api/logout - OIDC integration', () => {
    it('should use OIDC logout functions from oidc.ts', async () => {
      // Test that the OIDC module exports the required functions
      const oidcModule = await import('../Auth/oidc.js')

      expect(typeof oidcModule.isOidcConfigured).toBe('function')
      expect(typeof oidcModule.buildEndSessionUrl).toBe('function')

      // isOidcConfigured should check environment variables
      const originalIssuerUrl = process.env.KES_OIDC_ISSUER_URL
      const originalClientId = process.env.KES_OIDC_CLIENT_ID
      const originalClientSecret = process.env.KES_OIDC_CLIENT_SECRET

      // When env vars are not set, should return false
      delete process.env.KES_OIDC_ISSUER_URL
      delete process.env.KES_OIDC_CLIENT_ID
      delete process.env.KES_OIDC_CLIENT_SECRET
      expect(oidcModule.isOidcConfigured()).toBe(false)

      // Restore env vars
      if (originalIssuerUrl) process.env.KES_OIDC_ISSUER_URL = originalIssuerUrl
      if (originalClientId) process.env.KES_OIDC_CLIENT_ID = originalClientId
      if (originalClientSecret) process.env.KES_OIDC_CLIENT_SECRET = originalClientSecret
    })

    it('should import OIDC functions in router for logout endpoint', async () => {
      // Read the router.ts file and verify it imports OIDC functions
      const fs = await import('fs/promises')
      const routerContent = await fs.readFile(
        new URL('./router.ts', import.meta.url).pathname.replace('/router.test.ts', '/router.ts'),
        'utf-8',
      )

      // The router should import these OIDC functions
      expect(routerContent).toMatch(/import.*isOidcConfigured.*from.*oidc/i)
      expect(routerContent).toMatch(/import.*buildEndSessionUrl.*from.*oidc/i)

      // The logout endpoint should call these functions
      expect(routerContent).toMatch(/isOidcConfigured\(\)/)
      expect(routerContent).toMatch(/buildEndSessionUrl/)
    })
  })

  describe('POST /api/logout - Security Hardening', () => {
    it('MEDIUM: should be POST endpoint not GET (CSRF protection)', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      type Layer = {
        path: string
        methods: string[]
        stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
      }

      // Find the logout endpoint
      const logoutLayer = (router as unknown as { stack: Layer[] }).stack
        .find((l: Layer) => l.path === '/api/logout')

      expect(logoutLayer).toBeDefined()
      // Should only support POST, not GET
      expect(logoutLayer!.methods).toContain('POST')
      expect(logoutLayer!.methods).not.toContain('GET')
    })

    it('HIGH: should clear keToken cookie with maxAge: 0', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      type Layer = {
        path: string
        methods: string[]
        stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
      }

      const logoutLayer = (router as unknown as { stack: Layer[] }).stack
        .find((l: Layer) => l.path === '/api/logout' && l.methods.includes('POST'))

      expect(logoutLayer).toBeDefined()

      const cookieSetCalls: Array<{ name: string, value: string, options?: { maxAge?: number } }> = []

      const ctx = {
        user: { userId: 123 },
        status: 0,
        body: undefined as unknown,
        io: {
          fetchSockets: async () => [],
        },
        cookies: {
          set: (name: string, value: string, options?: { maxAge?: number }) => {
            cookieSetCalls.push({ name, value, options })
          },
        },
      }

      const handler = logoutLayer!.stack[logoutLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // Find the keToken cookie call
      const keTokenCall = cookieSetCalls.find(c => c.name === 'keToken')
      expect(keTokenCall).toBeDefined()
      expect(keTokenCall!.value).toBe('')
      expect(keTokenCall!.options?.maxAge).toBe(0)
    })

    it('MEDIUM: should disconnect user sockets on logout', async () => {
      const routerModule = await import('./router.js')
      const router = routerModule.default

      type Layer = {
        path: string
        methods: string[]
        stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
      }

      const logoutLayer = (router as unknown as { stack: Layer[] }).stack
        .find((l: Layer) => l.path === '/api/logout' && l.methods.includes('POST'))

      expect(logoutLayer).toBeDefined()

      const disconnectedSockets: number[] = []
      const mockSockets = [
        { user: { userId: 123 }, disconnect: (close: boolean) => { if (close) disconnectedSockets.push(123) } },
        { user: { userId: 456 }, disconnect: (close: boolean) => { if (close) disconnectedSockets.push(456) } },
        { user: { userId: 123 }, disconnect: (close: boolean) => { if (close) disconnectedSockets.push(123) } },
      ]

      const ctx = {
        user: { userId: 123 },
        status: 0,
        body: undefined as unknown,
        io: {
          fetchSockets: async () => mockSockets,
        },
        cookies: {
          set: () => {},
        },
      }

      const handler = logoutLayer!.stack[logoutLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // Should have disconnected user 123's sockets (two of them), but not 456
      expect(disconnectedSockets).toEqual([123, 123])
      expect(disconnectedSockets).not.toContain(456)
    })
  })
})
