const log = require('./Log').getLogger(`${process.env.KF_CHILD_PROCESS || 'main'}[${process.pid}]`)
const path = require('path')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
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

  static async open ({ readonly = true, env = process.env } = {}) {
    if (_db) throw new Error('Database already open')

    const dbPath = path.resolve(env.KF_SERVER_PATH_DATA, 'database.sqlite3')
    log.info('Opening database file %s %s', readonly ? '(read-only)' : '(writeable)', dbPath)

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: readonly ? sqlite3.OPEN_READONLY : null,
    })

    if (!readonly) {
      await db.migrate({
        migrationsPath: path.join(__dirname, 'schemas'),
      })

      // SQLite locking via WAL doesn't seem to work under WSL...
      if (!Object.prototype.hasOwnProperty.call(process.env, 'WSL_DISTRO_NAME')) {
        await db.run('PRAGMA journal_mode = WAL;')
      }
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
