import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-user.sqlite'

// We need to dynamically import User after database is open
// because User.ts destructures `db` at import time
let User: typeof import('./User.js').default
let db: typeof import('../lib/Database.js').default

describe('User', () => {
  beforeAll(async () => {
    // Remove any existing test database
    await fse.remove(TEST_DB_PATH)

    // Open fresh test database with migrations FIRST
    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    // NOW import User module (after db is initialized)
    const UserModule = await import('./User.js')
    User = UserModule.default
  })

  afterAll(async () => {
    const Database = await import('../lib/Database.js')
    await Database.close()
    await fse.remove(TEST_DB_PATH)
  })

  describe('getOrCreateFromHeader', () => {
    beforeEach(async () => {
      // Clean up users between tests (keep roles table intact)
      await db.db?.run('DELETE FROM users')
    })

  describe('creating new users', () => {
    it('should create a new user with standard role when isAdmin is false', async () => {
      const user = await User.getOrCreateFromHeader('testuser', false)

      expect(user.username).toBe('testuser')
      expect(user.name).toBe('testuser') // Display name defaults to username
      expect(user.role).toBe('standard')
    })

    it('should create a new user with admin role when isAdmin is true', async () => {
      const user = await User.getOrCreateFromHeader('adminuser', true)

      expect(user.username).toBe('adminuser')
      expect(user.role).toBe('admin')
    })

    it('should trim whitespace from username', async () => {
      const user = await User.getOrCreateFromHeader('  spaceduser  ', false)

      expect(user.username).toBe('spaceduser')
    })

    it('should throw error for empty username', async () => {
      await expect(User.getOrCreateFromHeader('', false))
        .rejects.toThrow('Username is required')
    })
  })

  describe('existing user - admin promotion', () => {
    it('should promote existing standard user to admin when isAdmin becomes true', async () => {
      // First, create user as standard
      const user1 = await User.getOrCreateFromHeader('promotableuser', false)
      expect(user1.role).toBe('standard')
      const originalDateUpdated = user1.dateUpdated

      // Wait a moment to ensure dateUpdated would change
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Now call again with isAdmin=true
      const user2 = await User.getOrCreateFromHeader('promotableuser', true)

      expect(user2.userId).toBe(user1.userId) // Same user
      expect(user2.role).toBe('admin') // Promoted
      expect(user2.dateUpdated).toBeGreaterThan(originalDateUpdated) // Updated timestamp
    })
  })

  describe('existing user - admin demotion (STRICT SYNC)', () => {
    it('should demote existing admin user to standard when isAdmin becomes false', async () => {
      // First, create user as admin
      const user1 = await User.getOrCreateFromHeader('demotableuser', true)
      expect(user1.role).toBe('admin')
      const originalDateUpdated = user1.dateUpdated

      // Wait a moment to ensure dateUpdated would change
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Now call again with isAdmin=false - THIS SHOULD DEMOTE
      const user2 = await User.getOrCreateFromHeader('demotableuser', false)

      expect(user2.userId).toBe(user1.userId) // Same user
      expect(user2.role).toBe('standard') // Demoted (THIS IS THE NEW BEHAVIOR)
      expect(user2.dateUpdated).toBeGreaterThan(originalDateUpdated) // Updated timestamp
    })

    it('should not change dateUpdated if role is already correct', async () => {
      // Create user as standard
      const user1 = await User.getOrCreateFromHeader('unchangeduser', false)
      expect(user1.role).toBe('standard')
      const originalDateUpdated = user1.dateUpdated

      // Wait then call again with same isAdmin=false
      await new Promise(resolve => setTimeout(resolve, 1100))
      const user2 = await User.getOrCreateFromHeader('unchangeduser', false)

      expect(user2.role).toBe('standard')
      expect(user2.dateUpdated).toBe(originalDateUpdated) // Should not change
    })
  })

  describe('case insensitivity', () => {
    it('should find existing user with different case username', async () => {
      // Create user
      const user1 = await User.getOrCreateFromHeader('CaseSensitiveUser', false)

      // Retrieve with different case
      const user2 = await User.getOrCreateFromHeader('casesensitiveuser', false)

      expect(user2.userId).toBe(user1.userId) // Same user
    })
  })

  describe('isFirstRun clearing on first SSO admin', () => {
    beforeEach(async () => {
      // Reset isFirstRun to true before each test
      await db.db?.run('REPLACE INTO prefs (key, data) VALUES (\'isFirstRun\', \'true\')')
    })

    it('should clear isFirstRun when first SSO admin logs in', async () => {
      // Verify isFirstRun is true initially
      const before = await db.db?.get('SELECT data FROM prefs WHERE key = \'isFirstRun\'')
      expect(JSON.parse(before.data)).toBe(true)

      // Admin logs in
      await User.getOrCreateFromHeader('firstadmin', true)

      // isFirstRun should now be false
      const after = await db.db?.get('SELECT data FROM prefs WHERE key = \'isFirstRun\'')
      expect(JSON.parse(after.data)).toBe(false)
    })

    it('should NOT clear isFirstRun when non-admin SSO user logs in', async () => {
      // Verify isFirstRun is true initially
      const before = await db.db?.get('SELECT data FROM prefs WHERE key = \'isFirstRun\'')
      expect(JSON.parse(before.data)).toBe(true)

      // Non-admin logs in
      await User.getOrCreateFromHeader('normaluser', false)

      // isFirstRun should still be true
      const after = await db.db?.get('SELECT data FROM prefs WHERE key = \'isFirstRun\'')
      expect(JSON.parse(after.data)).toBe(true)
    })

    it('should NOT change isFirstRun when it is already false', async () => {
      // Set isFirstRun to false (system already initialized)
      await db.db?.run('REPLACE INTO prefs (key, data) VALUES (\'isFirstRun\', \'false\')')

      // Admin logs in
      await User.getOrCreateFromHeader('lateradmin', true)

      // isFirstRun should still be false
      const after = await db.db?.get('SELECT data FROM prefs WHERE key = \'isFirstRun\'')
      expect(JSON.parse(after.data)).toBe(false)
    })
  })
  }) // end getOrCreateFromHeader

  describe('createGuest', () => {
    let testRoomId: number

    beforeEach(async () => {
      // Clean up users between tests (keep roles table intact)
      await db.db?.run('DELETE FROM users')
      await db.db?.run('DELETE FROM rooms')

      // Create a test room for guest creation
      const now = Math.floor(Date.now() / 1000)
      const insertRoom = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Test Room', 'open', now, now, JSON.stringify({ invitationToken: 'test-token-uuid' })],
      )
      testRoomId = insertRoom?.lastID ?? 0
    })

    it('should create a guest with unique username containing roomId', async () => {
      const guest = await User.createGuest('TestGuest', testRoomId)

      expect(guest.name).toBe('TestGuest')
      expect(guest.role).toBe('guest')
      // Username format: guest-{roomId}-{8 hex chars}
      expect(guest.username).toMatch(new RegExp(`^guest-${testRoomId}-[a-f0-9]{8}$`))
    })

    it('should create multiple guests with unique usernames', async () => {
      const guest1 = await User.createGuest('Alice', testRoomId)
      const guest2 = await User.createGuest('Bob', testRoomId)
      const guest3 = await User.createGuest('Alice', testRoomId) // Same name, should still work

      expect(guest1.username).not.toBe(guest2.username)
      expect(guest1.username).not.toBe(guest3.username)
      expect(guest2.username).not.toBe(guest3.username)

      // All should have correct format
      const usernameRegex = new RegExp(`^guest-${testRoomId}-[a-f0-9]{8}$`)
      expect(guest1.username).toMatch(usernameRegex)
      expect(guest2.username).toMatch(usernameRegex)
      expect(guest3.username).toMatch(usernameRegex)
    })

    it('should throw error for non-existent room', async () => {
      await expect(User.createGuest('TestGuest', 99999))
        .rejects.toThrow('Room not found')
    })

    it('should throw error for closed room', async () => {
      // Close the test room
      await db.db?.run('UPDATE rooms SET status = ? WHERE roomId = ?', ['closed', testRoomId])

      await expect(User.createGuest('TestGuest', testRoomId))
        .rejects.toThrow('Room not found')
    })

    it('should throw error for empty guest name', async () => {
      await expect(User.createGuest('', testRoomId))
        .rejects.toThrow('Display name is required')
    })

    it('should throw error for name too short', async () => {
      await expect(User.createGuest('A', testRoomId))
        .rejects.toThrow(/Display name must have/)
    })

    it('should throw error for name too long', async () => {
      const longName = 'A'.repeat(100)
      await expect(User.createGuest(longName, testRoomId))
        .rejects.toThrow(/Display name must have/)
    })

    it('should return user object with all required fields', async () => {
      const guest = await User.createGuest('TestGuest', testRoomId)

      expect(guest.userId).toBeTypeOf('number')
      expect(guest.username).toBeTypeOf('string')
      expect(guest.name).toBe('TestGuest')
      expect(guest.role).toBe('guest')
      expect(guest.dateCreated).toBeTypeOf('number')
    })
  }) // end createGuest

  describe('cleanupGuests', () => {
    let openRoomId: number
    let closedRoomId: number

    beforeEach(async () => {
      // Clean up users and rooms between tests
      await db.db?.run('DELETE FROM users')
      await db.db?.run('DELETE FROM rooms')

      const now = Math.floor(Date.now() / 1000)

      // Create an open room
      const openInsert = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Open Room', 'open', now, now, JSON.stringify({ invitationToken: 'open-token' })],
      )
      openRoomId = openInsert?.lastID ?? 0

      // Create a closed room
      const closedInsert = await db.db?.run(
        'INSERT INTO rooms (name, status, dateCreated, lastActivity, data) VALUES (?, ?, ?, ?, ?)',
        ['Closed Room', 'closed', now, now, JSON.stringify({ invitationToken: 'closed-token' })],
      )
      closedRoomId = closedInsert?.lastID ?? 0
    })

    it('should remove guests whose rooms are closed', async () => {
      // Create guest for open room (should NOT be removed)
      const openGuest = await User.createGuest('OpenRoomGuest', openRoomId)

      // Manually insert guest for closed room (can't use createGuest since room is closed)
      const now = Math.floor(Date.now() / 1000)
      await db.db?.run(
        `INSERT INTO users (username, password, name, dateCreated, roleId, authProvider)
         VALUES (?, ?, ?, ?, (SELECT roleId FROM roles WHERE name = 'guest'), 'app')`,
        [`guest-${closedRoomId}-abcd1234`, 'dummy', 'ClosedRoomGuest', now],
      )

      // Run cleanup
      const removed = await User.cleanupGuests()

      // Verify: closed room guest removed, open room guest kept
      const openGuestAfter = await User.getById(openGuest.userId, true)
      expect(openGuestAfter).toBeTruthy()
      expect(openGuestAfter.username).toBe(openGuest.username)

      // Closed room guest should be gone
      const closedGuestAfter = await db.db?.get(
        'SELECT * FROM users WHERE username = ?',
        [`guest-${closedRoomId}-abcd1234`],
      )
      expect(closedGuestAfter).toBeFalsy()

      expect(removed).toBeGreaterThan(0)
    })

    it('should not remove guests from open rooms', async () => {
      // Create multiple guests for open room
      const guest1 = await User.createGuest('Guest1', openRoomId)
      const guest2 = await User.createGuest('Guest2', openRoomId)

      // Run cleanup
      await User.cleanupGuests()

      // All guests should still exist
      const guest1After = await User.getById(guest1.userId, true)
      const guest2After = await User.getById(guest2.userId, true)

      expect(guest1After).toBeTruthy()
      expect(guest2After).toBeTruthy()
    })

    it('should not remove non-guest users', async () => {
      // Create standard and admin users
      const standardUser = await User.getOrCreateFromHeader('standarduser', false, false)
      const adminUser = await User.getOrCreateFromHeader('adminuser', true, false)

      // Run cleanup
      await User.cleanupGuests()

      // Non-guest users should still exist
      const standardAfter = await User.getById(standardUser.userId, true)
      const adminAfter = await User.getById(adminUser.userId, true)

      expect(standardAfter).toBeTruthy()
      expect(adminAfter).toBeTruthy()
      expect(standardAfter.role).toBe('standard')
      expect(adminAfter.role).toBe('admin')
    })

    it('should return count of removed guests', async () => {
      // Create guests for closed room by directly inserting (since createGuest validates open rooms)
      const now = Math.floor(Date.now() / 1000)
      for (let i = 0; i < 3; i++) {
        await db.db?.run(
          `INSERT INTO users (username, password, name, dateCreated, roleId, authProvider)
           VALUES (?, ?, ?, ?, (SELECT roleId FROM roles WHERE name = 'guest'), 'app')`,
          [`guest-${closedRoomId}-test000${i}`, 'dummy', `ClosedGuest${i}`, now],
        )
      }

      // Run cleanup
      const removed = await User.cleanupGuests()

      // Should have removed 3 guests
      expect(removed).toBe(3)
    })
  }) // end cleanupGuests
}) // end User
