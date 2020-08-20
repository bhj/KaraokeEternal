const path = require('path')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

const _dbPath = process.env.KF_USER_PATH || path.resolve(path.dirname(require.main.filename), '..')
const _dbFile = path.resolve(_dbPath, 'database.sqlite3')
let _db

class Database {
  static async close () {
    // @todo
  }

  static async open ({ readonly = true, log = () => {} } = {}) {
    if (_db) throw new Error('Database already opened')

    log('Opening database file %s %s', readonly ? '(read-only)' : '(writeable)', _dbFile)

    const db = await open({
      filename: _dbFile,
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
