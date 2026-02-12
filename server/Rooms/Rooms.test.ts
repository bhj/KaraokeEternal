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

// Shared database setup for all tests
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

describe('Rooms.createEphemeral', () => {
  let testUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let guestRoleId: number
  let standardRoleId: number

  beforeAll(async () => {
    // Get role IDs
    const guestRole = await db.db?.get('SELECT roleId FROM roles WHERE name = ?', ['guest'])
    const standardRole = await db.db?.get('SELECT roleId FROM roles WHERE name = ?', ['standard'])
    guestRoleId = guestRole?.roleId
    standardRoleId = standardRole?.roleId
  })

  beforeEach(async () => {
    // Clean up between tests
    await db.db?.run('DELETE FROM rooms')
    await db.db?.run('DELETE FROM queue')
    await db.db?.run('DELETE FROM hydraPresets')
    await db.db?.run('DELETE FROM hydraFolders')
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
    expect(room.prefs.allowGuestOrchestrator).toBe(true)
    expect(room.prefs.allowGuestCameraRelay).toBe(true)
    expect(room.prefs.allowRoomCollaboratorsToSendVisualizer).toBe(true)
    expect(room.prefs.partyPresetFolderId).toBe(null)
    expect(room.prefs.playerPresetFolderId).toBe(null)
    expect(room.prefs.restrictCollaboratorsToPartyPresetFolder).toBe(false)
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

  it('applies preset policy defaults from environment for new ephemeral rooms', async () => {
    const prevFolderId = process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID
    const prevRestrict = process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS

    process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID = '123'
    process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS = 'true'

    try {
      const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')
      const result = await Rooms.get(roomId)
      const room = result.entities[roomId]

      expect(room.prefs.partyPresetFolderId).toBe(123)
      expect(room.prefs.playerPresetFolderId).toBe(123)
      expect(room.prefs.restrictCollaboratorsToPartyPresetFolder).toBe(true)
    } finally {
      if (prevFolderId === undefined) delete process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID
      else process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID = prevFolderId

      if (prevRestrict === undefined) delete process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS
      else process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS = prevRestrict
    }
  })

  it('resolves default party preset folder by name when no numeric default is set', async () => {
    const prevFolderId = process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID
    const prevFolderName = process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_NAME
    const prevRestrict = process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS

    process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID = ''
    process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_NAME = 'Party Gold'
    process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS = 'true'

    try {
      const now = Math.floor(Date.now() / 1000)
      await db.db?.run(
        'INSERT INTO hydraFolders (name, authorUserId, authorName, sortOrder, dateCreated) VALUES (?, ?, ?, ?, ?)',
        ['Party Gold', testUser.userId, testUser.name, 0, now],
      )

      const folder = await db.db?.get('SELECT folderId FROM hydraFolders WHERE name = ? COLLATE NOCASE LIMIT 1', ['Party Gold'])

      const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')
      const result = await Rooms.get(roomId)
      const room = result.entities[roomId]

      expect(room.prefs.partyPresetFolderId).toBe(folder?.folderId)
      expect(room.prefs.playerPresetFolderId).toBe(folder?.folderId)
      expect(room.prefs.restrictCollaboratorsToPartyPresetFolder).toBe(true)
    } finally {
      if (prevFolderId === undefined) delete process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID
      else process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID = prevFolderId

      if (prevFolderName === undefined) delete process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_NAME
      else process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_NAME = prevFolderName

      if (prevRestrict === undefined) delete process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS
      else process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS = prevRestrict
    }
  })
  it('ignores invalid preset policy defaults from environment', async () => {
    const prevFolderId = process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID
    const prevRestrict = process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS

    process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID = 'not-a-number'
    process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS = 'true'

    try {
      const roomId = await Rooms.createEphemeral(testUser.userId, 'Test Room')
      const result = await Rooms.get(roomId)
      const room = result.entities[roomId]

      expect(room.prefs.partyPresetFolderId).toBe(null)
      expect(room.prefs.playerPresetFolderId).toBe(null)
      expect(room.prefs.restrictCollaboratorsToPartyPresetFolder).toBe(false)
    } finally {
      if (prevFolderId === undefined) delete process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID
      else process.env.KES_DEFAULT_PARTY_PRESET_FOLDER_ID = prevFolderId

      if (prevRestrict === undefined) delete process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS
      else process.env.KES_DEFAULT_RESTRICT_COLLAB_PRESETS = prevRestrict
    }
  })
})

describe('Rooms.getByInvitationToken', () => {
  beforeEach(async () => {
    // Clean up between tests
    await db.db?.run('DELETE FROM rooms')
    await db.db?.run('DELETE FROM queue')
    await db.db?.run('DELETE FROM hydraPresets')
    await db.db?.run('DELETE FROM hydraFolders')
    await db.db?.run('DELETE FROM users')
  })

  it('should find room by invitation token', async () => {
    const now = Math.floor(Date.now() / 1000)
    const token = '12345678-1234-1234-1234-123456789012'

    await db.db?.run(
      'INSERT INTO rooms (name, status, dateCreated, data) VALUES (?, ?, ?, ?)',
      ['Test Room', 'open', now, JSON.stringify({ invitationToken: token })],
    )

    const room = await Rooms.getByInvitationToken(token)

    expect(room).toBeDefined()
    expect(room?.name).toBe('Test Room')
    expect(room?.status).toBe('open')
  })

  it('should return null for non-existent token', async () => {
    const room = await Rooms.getByInvitationToken('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    expect(room).toBeNull()
  })

  it('should return null for closed room', async () => {
    const now = Math.floor(Date.now() / 1000)
    const token = '12345678-1234-1234-1234-123456789012'

    await db.db?.run(
      'INSERT INTO rooms (name, status, dateCreated, data) VALUES (?, ?, ?, ?)',
      ['Closed Room', 'closed', now, JSON.stringify({ invitationToken: token })],
    )

    const room = await Rooms.getByInvitationToken(token)
    expect(room).toBeNull()
  })

  it('should return null for room without invitation token', async () => {
    const now = Math.floor(Date.now() / 1000)

    await db.db?.run(
      'INSERT INTO rooms (name, status, dateCreated, data) VALUES (?, ?, ?, ?)',
      ['No Token Room', 'open', now, '{}'],
    )

    const room = await Rooms.getByInvitationToken('12345678-1234-1234-1234-123456789012')
    expect(room).toBeNull()
  })
})
