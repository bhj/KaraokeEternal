import path from 'path'
import fse from 'fs-extra'
import sqlite3 from 'sqlite3'
import { open as sqliteOpen, Database as SqliteDatabase } from 'sqlite'
import getLogger from './Log.js'

const log = getLogger('db')

class Database {
  static refs: { db?: SqliteDatabase } = {}

  static async close () {
    if (Database.refs.db) {
      log.info('Closing database file %s', Database.refs.db.config.filename)
      await Database.refs.db.close()
    }
  }

  static async open ({ file, ro = true }: { file: string, ro?: boolean } = { file: '', ro: true }) {
    if (Database.refs.db) throw new Error('Database already open')
    log.info('Opening database file %s %s', ro ? '(read-only)' : '(writeable)', file)

    // create path if it doesn't exist
    fse.ensureDirSync(path.dirname(file))

    const db = await sqliteOpen({
      filename: file,
      driver: sqlite3.Database,
      mode: ro ? sqlite3.OPEN_READONLY : null,
    })

    if (!ro) {
      await db.migrate({
        migrationsPath: path.join(import.meta.dirname, 'schemas'),
      })

      await db.run('PRAGMA journal_mode = WAL;')
      await db.run('PRAGMA foreign_keys = ON;')
    }

    Database.refs.db = db
    return db
  }
}

export const open = Database.open
export const close = Database.close

export default Database.refs
