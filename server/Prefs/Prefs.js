const path = require('path')
const db = require('sqlite')
const squel = require('squel')
const crypto = require('crypto')
const debug = require('debug')
const log = debug('app:prefs')

class Prefs {
  /**
   * Gets prefs (including media paths)
   * @return {Promise} Prefs object
   */
  static async get () {
    const prefs = {
      paths: { result: [], entities: {} }
    }

    try {
      const q = squel.select()
        .from('prefs')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      // json-decode key/val pairs
      rows.forEach(row => {
        prefs[row.key] = JSON.parse(row.data)
      })
    } catch (err) {
      log(err)
      return Promise.reject(err)
    }

    // include media paths
    try {
      const q = squel.select()
        .from('paths')
        .order('priority')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        prefs.paths.entities[row.pathId] = row
        prefs.paths.result.push(row.pathId)
      }
    } catch (err) {
      log(err)
      return Promise.reject(err)
    }

    return prefs
  }

  /**
   * Add media path
   * @param  {string}  dir Absolute path
   * @return {Promise}     pathId (Number) of newly-added path
   */
  static async addPath (dir) {
    try {
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
    } catch (err) {
      log(err)
      return Promise.reject(err)
    }
  }

  /**
   * Remove media path
   * @param  {Number}  pathId
   * @return {Promise}
   */
  static async removePath (pathId) {
    try {
      const q = squel.delete()
        .from('paths')
        .where('pathId = ?', pathId)

      const { text, values } = q.toParam()
      await db.run(text, values)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  /**
   * Create or rotate JWT secret key
   * @return {Promise}  jwtKey (string)
   */
  static async jwtKeyRefresh () {
    const jwtKey = crypto.randomBytes(48).toString('base64') // 64 char
    log('Rotating JWT secret key (length=%s)', jwtKey.length)

    // try to UPDATE
    try {
      const q = squel.update()
        .table('prefs')
        .set('data', JSON.stringify(jwtKey))
        .where("key = 'jwtKey'")

      const { text, values } = q.toParam()
      const res = await db.run(text, values)
      if (res.stmt.changes) return jwtKey
    } catch (err) {
      log(err)
      throw err
    }

    // need to INSERT
    try {
      const q = squel.insert()
        .into('prefs')
        .set('key', 'jwtKey')
        .set('data', JSON.stringify(jwtKey))

      const { text, values } = q.toParam()
      await db.run(text, values)
      return jwtKey
    } catch (err) {
      log(err)
      throw err
    }
  }
}

module.exports = Prefs
