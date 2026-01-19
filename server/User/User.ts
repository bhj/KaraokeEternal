import Database from '../lib/Database.js'
import sql from 'sqlate'
import bcrypt from '../lib/bcrypt.js'
import Queue from '../Queue/Queue.js'
import { randomChars } from '../lib/util.js'

export const IMG_MAX_LENGTH = 50000 // bytes
export const BCRYPT_ROUNDS = 12
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 128
export const PASSWORD_MIN_LENGTH = 6
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 50

const { db } = Database

class User {
  /**
   * Get user by userId
   *
   * @param  {Number}  userId
   * @param  {Bool}  creds  Whether to include username and password in result
   * @return {Promise}
   */
  static async getById (userId, creds = false) {
    if (typeof userId !== 'number') {
      throw new Error('userId must be a number')
    }

    return User._get({ userId, username: undefined }, creds)
  }

  /**
   * Get user by username
   *
   * @param  {String}  username
   * @param  {Bool}  creds  Whether to include username and password in result
   * @return {Promise}
   */
  static async getByUsername (username, creds = false) {
    if (typeof username !== 'string') {
      throw new Error('username must be a string')
    }

    return User._get({ userId: undefined, username }, creds)
  }

  /**
   * Gets all users
   *
   * @return {Promise}      normalized list of users
   */
  static async get () {
    const result = []
    const entities = {}

    const query = sql`
      SELECT users.userId, users.username, users.name, users.dateCreated, users.dateUpdated, roles.name AS role
      FROM users
        INNER JOIN roles USING (roleId)
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach((row) => {
      result.push(row.userId)
      entities[row.userId] = row
    })

    return { result, entities }
  }

  static async create ({
    username,
    newPassword,
    newPasswordConfirm,
    name,
    image,
  }, role = 'standard') {
    username = username?.trim()
    name = name?.trim()

    const fields = new Map()

    if (role !== 'guest') {
      if (!username) {
        throw new Error('Username or email is required')
      }

      if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
        throw new Error(`Username or email must have ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`)
      }

      if (!newPassword) {
        throw new Error('Password is required')
      }

      if (newPassword.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must have at least ${PASSWORD_MIN_LENGTH} characters`)
      }

      if (!newPasswordConfirm) {
        throw new Error('Password confirmation is required')
      }

      if (newPassword !== newPasswordConfirm) {
        throw new Error('New passwords do not match')
      }

      if (await User.getByUsername(username)) {
        throw new Error('Username or email is not available')
      }

      fields.set('username', username)
      fields.set('password', await bcrypt.hash(newPassword, BCRYPT_ROUNDS))
    } else {
      let res: { count?: number } = {}

      // ensure unique guest username
      do {
        fields.set('username', `guest-${randomChars(5)}`)

        const query = sql`
        SELECT COUNT(*) AS count
        FROM users
        WHERE username = ${fields.get('username')}
        `
        res = await db.get(String(query), query.parameters) as { count: number }
      } while (res.count > 0)

      fields.set('password', 'guest')
    }

    if (!name) {
      throw new Error('Display name is required')
    }

    if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      throw new Error(`Display name must have ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`)
    }

    fields.set('name', name)
    fields.set('dateCreated', Math.floor(Date.now() / 1000))
    fields.set('roleId', sql`(SELECT roleId FROM roles WHERE name = ${role})`)

    // user image?
    if (image) {
      if (image.length > IMG_MAX_LENGTH) {
        throw new Error('Invalid image')
      }

      fields.set('image', image)
    }

    const query = sql`
    INSERT INTO users ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
    VALUES ${sql.tuple(Array.from(fields.values()))}
  `
    const res = await db.run(String(query), query.parameters)

    if (typeof res.lastID !== 'number') {
      throw new Error('Unable to create user')
    }

    return res.lastID
  }

  static async validate ({ username, password }) {
    if (!username || !password) {
      throw new Error('Username/email and password are required')
    }

    const user = await User.getByUsername(username, true)

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Incorrect username/email or password')
    }

    return user
  }

  /**
   * Create or get a user from SSO header
   * Creates the user if they don't exist, returns existing user if they do
   *
   * @param  {String}  username  Username from auth header
   * @param  {Boolean} isAdmin   Whether user should have admin role
   * @return {Promise}           User object
   */
  static async getOrCreateFromHeader (username: string, isAdmin: boolean = false) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required')
    }

    username = username.trim()

    // Check if user already exists
    const existingUser = await User.getByUsername(username, true)
    if (existingUser) {
      // Sync admin status from SSO groups header
      if (isAdmin && existingUser.role !== 'admin') {
        const updateQuery = sql`
          UPDATE users
          SET roleId = (SELECT roleId FROM roles WHERE name = 'admin'),
              dateUpdated = ${Math.floor(Date.now() / 1000)}
          WHERE userId = ${existingUser.userId}
        `
        await db.run(String(updateQuery), updateQuery.parameters)
        existingUser.role = 'admin'
      }
      return existingUser
    }

    // Create new user with random UUID password (they'll never use it - header auth only)
    const role = isAdmin ? 'admin' : 'standard'
    const fields = new Map()
    fields.set('username', username)
    fields.set('password', await bcrypt.hash(crypto.randomUUID(), BCRYPT_ROUNDS))
    fields.set('name', username) // Display name = username
    fields.set('dateCreated', Math.floor(Date.now() / 1000))
    fields.set('roleId', sql`(SELECT roleId FROM roles WHERE name = ${role})`)

    const query = sql`
      INSERT INTO users ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    if (typeof res.lastID !== 'number') {
      throw new Error('Unable to create user from header')
    }

    // Return the newly created user
    return await User.getById(res.lastID, true)
  }

  /**
   * Remove a user
   *
   * @param  {Number}  userId
   * @return {Promise}
   */
  static async remove (userId) {
    if (typeof userId !== 'number') {
      throw new Error('userId must be a number')
    }

    // remove user's queue items
    const queueQuery = sql`
      SELECT queueId
      FROM queue
      WHERE userId = ${userId}
    `
    const queueRows = await db.all(String(queueQuery), queueQuery.parameters)

    for (const row of queueRows) {
      await Queue.remove(row.queueId)
    }

    // remove user's song stars
    const songStarsQuery = sql`
      DELETE FROM songStars
      WHERE userId = ${userId}
    `
    await db.run(String(songStarsQuery), songStarsQuery.parameters)

    // remove user's artist stars
    const artistStarsQuery = sql`
      DELETE FROM artistStars
      WHERE userId = ${userId}
    `
    await db.run(String(artistStarsQuery), artistStarsQuery.parameters)

    // remove the user
    const usersQuery = sql`
      DELETE FROM users
      WHERE userId = ${userId}
    `
    const usersQueryRes = await db.run(String(usersQuery), usersQuery.parameters)

    if (!usersQueryRes.changes) {
      throw new Error(`unable to remove userId: ${userId}`)
    }
  }

  /**
   * (private) runs the query
   * @param  {Object}  id   with fields 'username' or 'userId'
   * @param  {Bool}  creds  whether to include username and password in result
   * @return {Promise}      user object
   */
  static async _get ({ userId, username }, creds = false) {
    const query = sql`
      SELECT users.*, roles.name AS role
      FROM users
        INNER JOIN roles USING (roleId)
      WHERE ${typeof userId === 'number' ? sql`userId = ${userId}` : sql`LOWER(username) = ${username.toLowerCase()}`}
    `

    const user = await db.get(String(query), query.parameters)
    if (!user) return false

    if (!creds) {
      delete user.username
      delete user.password
    }

    return user
  }
}

export default User
