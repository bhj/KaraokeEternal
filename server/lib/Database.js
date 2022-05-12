const path = require('path')
const fse = require('fs-extra')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const log = require('./Log')('db')
let _db

class Database {
  static async close () {
    // depending on how the node process was started, it can receive
    // multiple SIGINTs or SIGTERMs in the same tick, so we clear the
    // reference first to avoid calling close() multiple times
    if (_db) {
      const db = _db
      _db = null

      log.info('Closing database file %s', db.config.filename)
      await db.close()
    }
  }

  static async open ({ file, ro = true } = {}) {
    if (_db) throw new Error('Database already open')

    log.info('Opening database file %s %s', ro ? '(read-only)' : '(writeable)', file)

    // create path if it doesn't exist
    fse.ensureDirSync(path.dirname(file))

    const db = await open({
      filename: file,
      driver: sqlite3.Database,
      mode: ro ? sqlite3.OPEN_READONLY : null,
    })

    if (!ro) {
      await db.migrate({
        migrationsPath: path.join(__dirname, 'schemas'),
      })

      await db.run('PRAGMA journal_mode = WAL;')
      await db.run('PRAGMA foreign_keys = ON;')
    }

    _db = db
    return _db
  }

  static get db () {
    if (!_db) throw new Error('Database not yet open')
    return _db
  }
}

module.exports = Database
