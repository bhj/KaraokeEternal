const log = require('./Log').getLogger(`${process.env.KF_CHILD_PROCESS || 'main'}[${process.pid}]`)
const path = require('path')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
let _db

class Database {
  static async close () {
    // @todo
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
