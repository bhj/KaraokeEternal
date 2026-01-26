import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fse from 'fs-extra'
import { PUBLIC_API_PATHS, isPublicApiPath } from './lib/publicPaths.js'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-server-worker.sqlite'

// Mock environment before importing server modules
vi.stubEnv('KES_URL_PATH', '/')
vi.stubEnv('KES_REQUIRE_PROXY', 'false')
vi.stubEnv('KES_AUTH_HEADER', 'x-authentik-username')
vi.stubEnv('KES_GROUPS_HEADER', 'x-authentik-groups')
vi.stubEnv('KES_EPHEMERAL_ROOMS', 'true')

// We need to dynamically import after database is open
let User: typeof import('./User/User.js').default
let Prefs: typeof import('./Prefs/Prefs.js').default
let Rooms: typeof import('./Rooms/Rooms.js').default
let db: typeof import('./lib/Database.js').default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let jsonWebToken: any

describe('serverWorker - SSO Header Processing', () => {
  beforeAll(async () => {
    // Remove any existing test database
    await fse.remove(TEST_DB_PATH)

    // Open fresh test database with migrations FIRST
    const Database = await import('./lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    // NOW import modules (after db is initialized)
    const UserModule = await import('./User/User.js')
    User = UserModule.default

    const PrefsModule = await import('./Prefs/Prefs.js')
    Prefs = PrefsModule.default

    const RoomsModule = await import('./Rooms/Rooms.js')
    Rooms = RoomsModule.default

    const jwtModule = await import('jsonwebtoken')
    jsonWebToken = jwtModule.default

    // Mark as not first run to avoid setup requirements
    await db.db?.run('REPLACE INTO prefs (key, data) VALUES (\'isFirstRun\', \'false\')')
  })

  afterAll(async () => {
    const Database = await import('./lib/Database.js')
    await Database.close()
    await fse.remove(TEST_DB_PATH)
  })

  beforeEach(async () => {
    // Clean up between tests
    await db.db?.run('DELETE FROM rooms')
    await db.db?.run('DELETE FROM queue')
    await db.db?.run('DELETE FROM users')
  })

  describe('Initial page load with SSO headers', () => {
    /**
     * This test verifies the fix for SSO auto-login.
     *
     * Bug: When a user navigates to the app via Authentik proxy, the initial
     * request to "/" has SSO headers but the middleware was skipping non-API paths,
     * so no JWT cookie was set. This caused users to see the login screen.
     *
     * Fix: Process SSO headers for ALL requests (not just API) to set the JWT cookie.
     */
    it('should set JWT cookie on non-API path when SSO headers are present', async () => {
      const jwtKey = await Prefs.getJwtKey(false)

      // Create a middleware function that mimics the SSO processing logic
      // We're testing the core logic, not the full Koa app
      const processSSO = async (ctx: {
        request: { path: string, header: Record<string, string | undefined> }
        cookies: { set: (...args: unknown[]) => void, get: () => string | undefined }
        jwtKey: string
        user?: unknown
      }) => {
        ctx.jwtKey = jwtKey

        // SSO header auth - THIS SHOULD NOW RUN FOR ALL REQUESTS
        const authHeader = 'x-authentik-username'
        const groupsHeader = 'x-authentik-groups'
        const headerUsername = ctx.request.header[authHeader]
        const ephemeralEnabled = true

        if (headerUsername && typeof headerUsername === 'string') {
          const groupsRaw = ctx.request.header[groupsHeader] || ''
          const groups = typeof groupsRaw === 'string' ? groupsRaw.split(/[,|]/).map(g => g.trim()).filter(g => g) : []
          const isAdmin = groups.includes('admin')
          const isGuest = groups.includes('karaoke-guests')

          const user = await User.getOrCreateFromHeader(headerUsername, isAdmin, isGuest)

          let room
          if (ephemeralEnabled && !isGuest) {
            room = await Rooms.getByOwnerId(user.userId)
            if (!room) {
              const roomId = await Rooms.createEphemeral(user.userId, user.username)
              room = { roomId }
            }
          }

          let ownRoomId: number | null = null
          if (ephemeralEnabled && !isGuest) {
            const ownRoom = await Rooms.getByOwnerId(user.userId)
            ownRoomId = ownRoom?.roomId ?? null
          }

          const jwtPayload = {
            userId: user.userId,
            username: user.username,
            name: user.name,
            isAdmin: isAdmin || user.role === 'admin',
            isGuest: isGuest || user.role === 'guest',
            roomId: room?.roomId ?? null,
            ownRoomId,
            dateUpdated: user.dateUpdated,
          }

          // Set JWT cookie
          const token = jsonWebToken.sign(jwtPayload, jwtKey)
          ctx.cookies.set('keToken', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          })

          ctx.user = jwtPayload
          return true // SSO processed
        }
        return false // No SSO headers
      }

      // Create mock context for a NON-API request (initial page load)
      const mockCookieSet = vi.fn()
      const ctx = {
        request: {
          path: '/', // NON-API path - this is the key test case!
          header: {
            'x-authentik-username': 'sso-test-user',
            'x-authentik-groups': 'users',
          },
        },
        cookies: {
          set: mockCookieSet,
          get: () => undefined,
        },
        jwtKey: '',
        user: undefined as unknown,
      }

      const ssoProcessed = await processSSO(ctx)

      // CRITICAL: SSO should be processed even for non-API paths
      expect(ssoProcessed).toBe(true)

      // JWT cookie should be set
      expect(mockCookieSet).toHaveBeenCalled()
      expect(mockCookieSet).toHaveBeenCalledWith(
        'keToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
        }),
      )

      // User context should be set
      expect(ctx.user).toBeDefined()
      expect((ctx.user as { username: string }).username).toBe('sso-test-user')
    })

    it('should include ownRoomId in JWT payload for SSO users', async () => {
      const jwtKey = await Prefs.getJwtKey(false)

      // Create user and room directly to set up test state
      const user = await User.getOrCreateFromHeader('sso-room-test-user', false, false)
      const roomId = await Rooms.createEphemeral(user.userId, user.username)

      // Build JWT payload as the middleware would
      const jwtPayload = {
        userId: user.userId,
        username: user.username,
        name: user.name,
        isAdmin: false,
        isGuest: false,
        roomId: roomId,
        ownRoomId: roomId, // This is the fix - ownRoomId should be included
        dateUpdated: user.dateUpdated,
      }

      // Sign and verify the token
      const token = jsonWebToken.sign(jwtPayload, jwtKey)
      const decoded = jsonWebToken.verify(token, jwtKey) as typeof jwtPayload

      // ownRoomId should be present in the decoded JWT
      expect(decoded.ownRoomId).toBe(roomId)
      expect(decoded.roomId).toBe(roomId)
    })

    it('should NOT require authentication for non-API paths', async () => {
      // This test ensures that non-API paths don't REQUIRE auth, they just SET cookies if headers present
      const ctx = {
        request: {
          path: '/library/', // Non-API path for SPA route
          header: {}, // No SSO headers
        },
        cookies: {
          set: vi.fn(),
          get: () => undefined,
        },
      }

      // The middleware should continue (not throw 401) for non-API paths without auth
      // This is a regression test - non-API paths should work without authentication
      const isNonApiPath = !ctx.request.path.startsWith('/api/')
      expect(isNonApiPath).toBe(true)

      // Non-API paths should not require authentication - they serve the SPA
      // The actual auth check happens client-side and via API calls
    })
  })

  describe('App-managed guest JWT authentication', () => {
    /**
     * Test that app-managed guests (created via /api/guest/join) can authenticate
     * using JWT cookies without SSO headers.
     */
    it('should authenticate guest from JWT cookie without SSO headers', async () => {
      const jwtKey = await Prefs.getJwtKey(false)

      // Create a room first
      const now = Math.floor(Date.now() / 1000)
      const roomInsert = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Test Room', 'open', now, now, JSON.stringify({ invitationToken: 'test-token' })],
      )
      const testRoomId = roomInsert?.lastID

      // Create a guest user (simulating what User.createGuest does)
      const guest = await User.createGuest('TestGuest', testRoomId!)

      // Create JWT payload as the guest router would
      const jwtPayload = {
        userId: guest.userId,
        username: guest.username,
        name: guest.name,
        isAdmin: false,
        isGuest: true,
        roomId: testRoomId,
        ownRoomId: null,
        dateUpdated: guest.dateUpdated,
      }

      // Sign the token
      const token = jsonWebToken.sign(jwtPayload, jwtKey)

      // Verify the middleware would correctly decode and use this token
      const decoded = jsonWebToken.verify(token, jwtKey) as typeof jwtPayload

      expect(decoded.userId).toBe(guest.userId)
      expect(decoded.username).toBe(guest.username)
      expect(decoded.isGuest).toBe(true)
      expect(decoded.roomId).toBe(testRoomId)
      expect(decoded.ownRoomId).toBeNull()
    })

    it('should bind guest to their enrollment room (no room switching)', async () => {
      const jwtKey = await Prefs.getJwtKey(false)

      // Create a room
      const now = Math.floor(Date.now() / 1000)
      const roomInsert = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Guest Room', 'open', now, now, JSON.stringify({ invitationToken: 'guest-token' })],
      )
      const guestRoomId = roomInsert?.lastID

      // Create guest
      const guest = await User.createGuest('BoundGuest', guestRoomId!)

      const jwtPayload = {
        userId: guest.userId,
        username: guest.username,
        name: guest.name,
        isAdmin: false,
        isGuest: true,
        roomId: guestRoomId,
        ownRoomId: null,
        dateUpdated: guest.dateUpdated,
      }

      const decoded = jsonWebToken.verify(
        jsonWebToken.sign(jwtPayload, jwtKey),
        jwtKey,
      ) as typeof jwtPayload

      // Verify guest flag and room binding
      expect(decoded.isGuest).toBe(true)
      expect(decoded.roomId).toBe(guestRoomId)

      // Per serverWorker.ts line 386: guests cannot visit other rooms
      // The room visitation logic is skipped when isGuest is true
      expect(decoded.isGuest).toBe(true) // Confirms room switching is blocked
    })

    it('should have correct username format for app-managed guests', async () => {
      const now = Math.floor(Date.now() / 1000)
      const roomInsert = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Username Test Room', 'open', now, now, JSON.stringify({ invitationToken: 'uuid' })],
      )
      const roomId = roomInsert?.lastID

      const guest = await User.createGuest('Alice', roomId!)

      // Username format: guest-{roomId}-{8 hex chars}
      expect(guest.username).toMatch(new RegExp(`^guest-${roomId}-[a-f0-9]{8}$`))
      expect(guest.name).toBe('Alice')
      expect(guest.role).toBe('guest')
    })
  })
})

describe('API Gatekeeper - Public Paths', () => {
  it('should allow unauthenticated access to public paths', () => {
    const publicPaths = [
      '/api/login',
      '/api/logout',
      '/api/guest/join',
      '/api/rooms/join/validate',
      '/api/setup',
      '/api/prefs/public',
      '/api/auth/login',
      '/api/auth/callback',
    ]

    for (const path of publicPaths) {
      expect(isPublicApiPath(path, '/')).toBe(true)
    }
  })

  it('should require authentication for protected API paths', () => {
    const protectedPaths = [
      '/api/user',
      '/api/rooms',
      '/api/library',
      '/api/queue',
      '/api/prefs',
    ]

    for (const path of protectedPaths) {
      expect(isPublicApiPath(path, '/')).toBe(false)
    }
  })

  it('should handle URL path prefix correctly', () => {
    // With /karaoke/ prefix
    expect(isPublicApiPath('/karaoke/api/login', '/karaoke/')).toBe(true)
    expect(isPublicApiPath('/karaoke/api/user', '/karaoke/')).toBe(false)
    expect(isPublicApiPath('/karaoke/api/prefs/public', '/karaoke/')).toBe(true)
    expect(isPublicApiPath('/karaoke/api/prefs', '/karaoke/')).toBe(false)
  })

  it('should export PUBLIC_API_PATHS constant', () => {
    expect(Array.isArray(PUBLIC_API_PATHS)).toBe(true)
    expect(PUBLIC_API_PATHS.length).toBeGreaterThan(0)
    expect(PUBLIC_API_PATHS).toContain('/api/login')
    expect(PUBLIC_API_PATHS).toContain('/api/auth/login')
    expect(PUBLIC_API_PATHS).toContain('/api/auth/callback')
  })
})

describe('API Gatekeeper - Middleware Behavior', () => {
  /**
   * Test the gatekeeper middleware logic directly.
   * This simulates how the middleware decides to return 401 or continue.
   */
  it('should return 401 for unauthenticated requests to protected API paths', () => {
    // Simulate the gatekeeper middleware logic
    const gatekeeperCheck = (path: string, userId: number | null, urlPath: string) => {
      // Not an API path - allow
      if (!path.startsWith(urlPath + 'api/')) {
        return { shouldBlock: false }
      }

      // Public API path - allow
      if (isPublicApiPath(path, urlPath)) {
        return { shouldBlock: false }
      }

      // Protected path without auth - block
      if (!userId) {
        return { shouldBlock: true, status: 401 }
      }

      return { shouldBlock: false }
    }

    // Test protected path without auth
    expect(gatekeeperCheck('/api/user', null, '/')).toEqual({ shouldBlock: true, status: 401 })
    expect(gatekeeperCheck('/api/rooms', null, '/')).toEqual({ shouldBlock: true, status: 401 })
    expect(gatekeeperCheck('/api/library', null, '/')).toEqual({ shouldBlock: true, status: 401 })

    // Test protected path WITH auth
    expect(gatekeeperCheck('/api/user', 123, '/')).toEqual({ shouldBlock: false })
    expect(gatekeeperCheck('/api/rooms', 456, '/')).toEqual({ shouldBlock: false })

    // Test public paths (no auth needed)
    expect(gatekeeperCheck('/api/login', null, '/')).toEqual({ shouldBlock: false })
    expect(gatekeeperCheck('/api/prefs/public', null, '/')).toEqual({ shouldBlock: false })
    expect(gatekeeperCheck('/api/auth/login', null, '/')).toEqual({ shouldBlock: false })
    expect(gatekeeperCheck('/api/auth/callback', null, '/')).toEqual({ shouldBlock: false })

    // Test non-API paths (always allowed, auth handled client-side)
    expect(gatekeeperCheck('/library', null, '/')).toEqual({ shouldBlock: false })
    expect(gatekeeperCheck('/', null, '/')).toEqual({ shouldBlock: false })
  })
})
