const db = require('sqlite')
const squel = require('squel')

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

    const q = squel.select()
      .where('userId = ?', userId)

    return User._get(q, creds)
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
      throw new Error(`username must be a string`)
    }

    const q = squel.select()
      .where('username = ?', username)

    return User._get(q, creds)
  }

  /**
   * (private) runs the query
   * @param  {[type]}  q     Squel query object
   * @param  {[type]}  creds Whether to include username and password in result
   * @return {Promise}       User object
   */
  static async _get (q, creds) {
    q.from('users')
      .field('userId, name, isAdmin, image, dateCreated, dateUpdated')

    if (creds) {
      q.field('username, password')
    }

    const { text, values } = q.toParam()
    const user = await db.get(text, values)

    if (!user) return false

    // client expects boolean
    user.isAdmin = user.isAdmin === 1

    return user
  }
}

module.exports = User
