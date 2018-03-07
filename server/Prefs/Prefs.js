const path = require('path')
const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:prefs')
const FileScanner = require('./FileScanner')

let _Scanner
let _isScanning = false
let _isScanQueued = false
let _isCanceling = false

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
      if (result.some(pathId =>
        dir.indexOf(entities[pathId].path + path.sep) === 0
      )) {
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
   * Start media scan
   * @return {Promise}
   */
  static async startScan () {
    log(`Media scan requested`)

    if (_isScanning) {
      if (_isScanQueued) {
        log(`  => skipping (media scan already queued)`)
      } else {
        _isScanQueued = true
        log(`  => media scan queued`)
      }

      return
    }

    _isScanning = true
    _isScanQueued = true
    _isCanceling = false

    while (_isScanQueued) {
      _isScanQueued = false

      try {
        log(`  => starting scan`)

        const prefs = await Prefs.get()
        _Scanner = new FileScanner(prefs)
        await _Scanner.scan()

        log('Media scan complete')
      } catch (err) {
        log(err)
      }

      if (_isCanceling) {
        log('Media scan canceled by user')
        break
      }
    } // end while

    _Scanner.emitDone()
    _Scanner.emitLibrary()

    _Scanner = null
    _isScanning = false
    _isCanceling = false
    _isScanQueued = false
  }

  static cancelScan () {
    if (_Scanner) {
      _isCanceling = true
      _Scanner.cancel()
    }
  }
}

module.exports = Prefs
