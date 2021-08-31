const db = require('../lib/Database').db
const sql = require('sqlate')

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

    let res, query

    query = sql`
      DELETE FROM queue
      WHERE userId = ${userId}
    `
    res = await db.run(String(query), query.parameters)

    query = sql`
      DELETE FROM users
      WHERE userId = ${userId}
    `
    res = await db.run(String(query), query.parameters)

    if (!res.changes) {
      throw new Error(`unable to remove userId: ${userId}`)
    }
  }

  /**
   * (private) runs the query
   * @param  {Object}  id   with fields 'username' or 'userId'
   * @param  {Bool}  creds  whether to include username and password in result
   * @return {Promise}      user object
   */
  static async _get ({ userId, username }, creds) {
    if (username) username = username.toLowerCase()

    const query = sql`
      SELECT *
      FROM users
      WHERE ${typeof userId === 'number' ? sql`userId = ${userId}` : sql`LOWER(username) = ${username}`}
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
