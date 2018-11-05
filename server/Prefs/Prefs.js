const path = require('path')
const db = require('sqlite')
const squel = require('squel')
const crypto = require('crypto')
const log = require('../lib/logger')('Prefs')

class Prefs {
  /**
   * Gets prefs (including media paths)
   * @return {Promise} Prefs object
   */
  static async get () {
    const prefs = {
      paths: { result: [], entities: {} }
    }

    {
      const q = squel.select()
        .from('prefs')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      // json-decode key/val pairs
      rows.forEach(row => {
        prefs[row.key] = JSON.parse(row.data)
      })
    }

    // include media paths
    {
      const q = squel.select()
        .from('paths')
        .order('priority')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        prefs.paths.entities[row.pathId] = row
        prefs.paths.result.push(row.pathId)
      }
    }

    // should never send to client
    delete prefs.jwtKey

    return prefs
  }

  /**
   * Add media path
   * @param  {string}  dir Absolute path
   * @return {Promise}     pathId (Number) of newly-added path
   */
  static async addPath (dir) {
    const prefs = await Prefs.get()
    const { result, entities } = prefs.paths

    // is it a subfolder of an already-added folder?
    if (result.some(pathId => (dir + path.sep).indexOf(entities[pathId].path + path.sep) === 0)) {
      throw new Error('Folder has already been added')
    }

    // insert path
    const q = squel.insert()
      .into('paths')
      .set('path', dir)
      // priority defaults to one higher than current highest
      .set('priority', result.length ? entities[result[result.length - 1]].priority + 1 : 0)

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (!Number.isInteger(res.stmt.lastID)) {
      throw new Error('invalid lastID from path insert')
    }

    // return pathId
    return res.stmt.lastID
  }

  /**
   * Remove media path
   * @param  {Number}  pathId
   * @return {Promise}
   */
  static async removePath (pathId) {
    const q = squel.delete()
      .from('paths')
      .where('pathId = ?', pathId)

    const { text, values } = q.toParam()
    await db.run(text, values)
  }

  /**
   * Get JWT secret key from db
   * @return {Promise}  jwtKey (string)
   */
  static async getJwtKey () {
    const q = squel.select()
      .from('prefs')
      .where("key = 'jwtKey'")

    const { text, values } = q.toParam()
    const row = await db.get(text, values)

    if (row && row.data) {
      const jwtKey = JSON.parse(row.data)

      if (jwtKey.length === 64) {
        return jwtKey
      }
    }

    return this.jwtKeyRefresh()
  }

  /**
   * Create or rotate JWT secret key
   * @return {Promise}  jwtKey (string)
   */
  static async jwtKeyRefresh () {
    const jwtKey = crypto.randomBytes(48).toString('base64') // 64 char
    log.info('Rotating JWT secret key (length=%s)', jwtKey.length)

    // try UPDATE
    // @todo use upsert
    {
      const q = squel.update()
        .table('prefs')
        .set('data', JSON.stringify(jwtKey))
        .where("key = 'jwtKey'")

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes) return jwtKey
    }

    // need to INSERT
    {
      const q = squel.insert()
        .into('prefs')
        .set('key', 'jwtKey')
        .set('data', JSON.stringify(jwtKey))

      const { text, values } = q.toParam()
      await db.run(text, values)
      return jwtKey
    }
  }
}

module.exports = Prefs
