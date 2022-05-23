const db = require('../lib/Database').db
const sql = require('sqlate')
const Queue = require('../Queue')

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

    return User._get({ userId }, creds)
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

    return User._get({ username }, creds)
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
      SELECT userId, username, name, isAdmin, dateCreated, dateUpdated
      FROM users
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach(row => {
      result.push(row.userId)

      row.isAdmin = row.isAdmin === 1
      entities[row.userId] = row
    })

    return { result, entities }
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
      SELECT *
      FROM users
      WHERE ${typeof userId === 'number' ? sql`userId = ${userId}` : sql`LOWER(username) = ${username.toLowerCase()}`}
    `

    const user = await db.get(String(query), query.parameters)
    if (!user) return false

    if (!creds) {
      delete user.username
      delete user.password
    }

    // client expects boolean
    user.isAdmin = user.isAdmin === 1

    return user
  }
}

module.exports = User
