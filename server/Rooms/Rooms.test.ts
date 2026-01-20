import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-rooms.sqlite'

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

describe('Rooms.createEphemeral', () => {
  let testUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let guestRoleId: number
  let standardRoleId: number

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

    // Get role IDs
    const guestRole = await db.db?.get('SELECT roleId FROM roles WHERE name = ?', ['guest'])
    const standardRole = await db.db?.get('SELECT roleId FROM roles WHERE name = ?', ['standard'])
    guestRoleId = guestRole?.roleId
    standardRoleId = standardRole?.roleId
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

    // Create test user
    testUser = await User.getOrCreateFromHeader('testowner', false, false)
  })

  it('should create room with QR code enabled by default', async () => {
    const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')

    const result = await Rooms.get(roomId)
    const room = result.entities[roomId]

    expect(room).toBeDefined()
    expect(room.prefs).toBeDefined()
    expect(room.prefs.qr).toBeDefined()
    expect(room.prefs.qr.isEnabled).toBe(true)
  })

  it('should allow guest accounts by default', async () => {
    const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')

    const result = await Rooms.get(roomId)
    const room = result.entities[roomId]

    expect(room.prefs.roles).toBeDefined()
    expect(room.prefs.roles[guestRoleId]).toBeDefined()
    expect(room.prefs.roles[guestRoleId].allowNew).toBe(true)
  })

  it('should allow standard accounts by default', async () => {
    const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')

    const result = await Rooms.get(roomId)
    const room = result.entities[roomId]

    expect(room.prefs.roles).toBeDefined()
    expect(room.prefs.roles[standardRoleId]).toBeDefined()
    expect(room.prefs.roles[standardRoleId].allowNew).toBe(true)
  })

  it('should pass role validation for guests', async () => {
    const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')

    // This should NOT throw because guests are allowed by default
    await expect(Rooms.validate(roomId, undefined, { role: 'guest', validatePassword: false }))
      .resolves.toBe(true)
  })

  it('should pass role validation for standard users', async () => {
    const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')

    // This should NOT throw because standard users are allowed by default
    await expect(Rooms.validate(roomId, undefined, { role: 'standard', validatePassword: false }))
      .resolves.toBe(true)
  })
})
