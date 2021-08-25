const path = require('path')
const db = require('../lib/Database').db
const sql = require('sqlate')
const crypto = require('crypto')
const log = require('../lib/Log').getLogger('Prefs')
const YoutubeProcessManager = require('../Youtube/YoutubeProcessManager')

class Prefs {
  // prefs that we'll send to non-admin users...
  static publicPrefs = [
    'isYouTubeEnabled',
    'isKaraokeGeneratorEnabled',
    'upcomingLyricsColor',
    'playedLyricsColor',
    'isUsernameRequired',
    'isPasswordRequired',
  ]

  /**
   * Gets prefs (includes media paths, does not inlcude JWT secret key)
   * @param publicOnly If true, only public prefs will be returned
   * @return {Promise} Prefs object
   */
  static async get (publicOnly = false) {
    const defaultPrefs = {
      isScanning: false,
      isReplayGainEnabled: false,
      isUsernameRequired: true,
      isPasswordRequired: true,
      paths: { result: [], entities: {} },
      scannerPct: 0,
      scannerText: '',
      isYouTubeEnabled: false,
      isKaraokeGeneratorEnabled: false,
      isConcurrentAlignmentEnabled: false,
      spleeterPath: 'spleeter',
      autoLyrixHost: 'http://localhost:3000',
      ffmpegPath: 'ffmpeg',
      upcomingLyricsColor: '#fff',
      playedLyricsColor: '#d9a000',
      tmpOutputPath: 'tmp',
      maxYouTubeProcesses: 3,
    }

    const prefs = {
      paths: { result: [], entities: {} }
    }

    {
      const query = sql`
        SELECT * FROM prefs
        WHERE key != "jwtKey"
      `
      const rows = await db.all(String(query), query.parameters)

      // json-decode key/val pairs
      rows.forEach(row => {
        prefs[row.key] = JSON.parse(row.data)
      })
    }

    // include media paths, if necessary...
    if (!publicOnly || Prefs.publicPrefs.includes('paths')) {
      const query = sql`
        SELECT * FROM paths
        ORDER BY priority
      `
      const rows = await db.all(String(query), query.parameters)

      for (const row of rows) {
        prefs.paths.entities[row.pathId] = row
        prefs.paths.result.push(row.pathId)
      }
    }

    // set defaults for any missing preferences...
    for (const [key, value] of Object.entries(defaultPrefs)) {
      if (!Object.prototype.hasOwnProperty.call(prefs, key)) {
        prefs[key] = value
      }
    }

    // only return public prefs if requested...
    if (publicOnly) {
      return Object.fromEntries(
        Object.entries(prefs).filter(([key, value]) => Prefs.publicPrefs.includes(key)))
    }

    return prefs
  }

  /**
   * Set a preference key
   * @param  {string}  key  Prefs key name
   * @param  {any}     data to be JSON encoded
   * @return {Promise}      Success/fail boolean
   */
  static async set (key, data) {
    const query = sql`
      REPLACE INTO prefs (key, data)
      VALUES (${key}, ${JSON.stringify(data)})
    `
    const res = await db.run(String(query), query.parameters)

    // in case one of the youtube prefs was updated, update the processor (if it's running)...
    YoutubeProcessManager.updateYoutubeProcessor()

    return res.changes === 1
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

    const fields = new Map()
    fields.set('path', dir)
    // priority defaults to one higher than current highest
    fields.set('priority', result.length ? entities[result[result.length - 1]].priority + 1 : 0)

    const query = sql`
      INSERT INTO paths ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid lastID from path insert')
    }

    return res.lastID
  }

  /**
   * Remove media path
   * @param  {Number}  pathId
   * @return {Promise}
   */
  static async removePath (pathId) {
    const query = sql`
      DELETE FROM paths
      WHERE pathId = ${pathId}
    `
    await db.run(String(query), query.parameters)
  }

  /**
   * Set media path priorities (not async!)
   * @param  {Array}  pathIds
   * @return {undefined}
   */
  static setPathPriority (pathIds) {
    if (!Array.isArray(pathIds)) {
      throw new Error('pathIds must be an array')
    }

    // using the raw database instance here so that the UPDATEs
    // run in a single transaction without async/await (which
    // would defeat the purpose of the transaction)
    // see https://github.com/mapbox/node-sqlite3/issues/304
    const rawDb = db.getDatabaseInstance()
    rawDb.exec('BEGIN TRANSACTION')

    pathIds.forEach((pathId, priority) => {
      if (typeof pathId !== 'number') {
        rawDb.exec('ROLLBACK TRANSACTION')
        throw new Error('Invalid pathId')
      }

      const query = sql`UPDATE paths SET priority = ${priority} WHERE pathId = ${pathId}`
      rawDb.run(String(query), query.parameters, err => {
        if (err) log.error(err.message)
      })
    })

    rawDb.exec('COMMIT')
  }

  /**
   * Get JWT secret key from db
   * @return {Promise}  jwtKey (string)
   */
  static async getJwtKey () {
    const query = sql`
      SELECT * FROM prefs
      WHERE key = "jwtKey"
    `
    const row = await db.get(String(query), query.parameters)

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

    const query = sql`
      REPLACE INTO prefs (key, data)
      VALUES ("jwtKey", ${JSON.stringify(jwtKey)})
    `
    const res = await db.run(String(query), query.parameters)

    if (res.changes) return jwtKey
  }
}

module.exports = Prefs
