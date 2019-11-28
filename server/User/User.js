const db = require('sqlite')
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
   * (private) runs the query
   * @param  {Object}  id   with fields 'username' or 'userId'
   * @param  {Bool}  creds  whether to include username and password in result
   * @return {Promise}      user object
   */
  static async _get ({ userId, username }, creds) {
    const query = sql`
      SELECT *
      FROM users
      WHERE ${typeof userId === 'number' ? sql`userId = ${userId}` : sql`username = ${username}`}
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
