import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-user.sqlite'

// We need to dynamically import User after database is open
// because User.ts destructures `db` at import time
let User: typeof import('./User.js').default
let db: typeof import('../lib/Database.js').default

describe('User.getOrCreateFromHeader', () => {
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
})
