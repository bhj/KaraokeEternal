import path from 'path'
import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite' // eslint-disable-line n/no-unsupported-features/node-builtins
import getLogger from './Log.js'

type SqlParam = string | number | bigint | null | Uint8Array

const log = getLogger('db')

export let db: DatabaseWrapper

export class DatabaseWrapper {
  private db: DatabaseSync
  public config: { filename: string }

  constructor (file: string) {
    this.config = { filename: file }
    this.db = new DatabaseSync(file)
  }

  close () {
    this.db.close()
  }

  all<T = unknown> (sql: string, params: unknown[] | Record<string, unknown> = []) {
    const stmt = this.db.prepare(sql)
    let res

    if (Array.isArray(params)) {
      res = stmt.all(...(params as SqlParam[]))
    } else {
      res = stmt.all(params as Record<string, SqlParam>)
    }

    return res as T[]
  }

  run (sql: string, params: unknown[] | Record<string, unknown> = []) {
    const stmt = this.db.prepare(sql)
    let res

    if (Array.isArray(params)) {
      res = stmt.run(...(params as SqlParam[]))
    } else {
      res = stmt.run(params as Record<string, SqlParam>)
    }

    return {
      lastID: res.lastInsertRowid,
      changes: res.changes,
    }
  }

  get<T = unknown> (sql: string, params: unknown[] | Record<string, unknown> = []) {
    const stmt = this.db.prepare(sql)
    let res

    if (Array.isArray(params)) {
      res = stmt.get(...(params as SqlParam[]))
    } else {
      res = stmt.get(params as Record<string, SqlParam>)
    }

    return res as T | undefined
  }

  exec (sql: string) {
    this.db.exec(sql)
  }

  migrate ({ migrationsPath, force = false, table = 'migrations' }: { migrationsPath: string, force?: boolean, table?: string }) {
    this.db.exec(`CREATE TABLE IF NOT EXISTS "${table}" (
      id INTEGER PRIMARY KEY,
      name TEXT,
      up TEXT,
      down TEXT
    )`)

    const files = fs.readdirSync(migrationsPath)
    const migrations = []

    for (const file of files) {
      const match = file.match(/^(\d+)-(.*)\.sql$/)

      if (match) {
        const content = fs.readFileSync(path.join(migrationsPath, file), 'utf8')
        const parts = content.split(/^--\s*Down/mi)
        const upSql = parts[0].replace(/^--\s*Up/mi, '').trim()
        const downSql = (parts[1] || '').trim()

        migrations.push({
          id: parseInt(match[1], 10),
          name: match[2],
          up: upSql,
          down: downSql,
          file,
        })
      }
    }

    migrations.sort((a, b) => a.id - b.id)

    // only one file can own an id: the first to apply gets recorded and every
    // other claimant is skipped for good, since ids are applied in order and
    // only once. usually a merge that brought in a migration alongside our own
    const seenIds = new Map<number, string>()

    for (const migration of migrations) {
      const dupe = seenIds.get(migration.id)

      if (dupe !== undefined) {
        throw new Error(`Duplicate migration id ${migration.id}: "${dupe}" and "${migration.file}". Renumber one of them.`)
      }

      seenIds.set(migration.id, migration.file)
    }

    let dbMigrations = this.all<{ id: number, name: string, up: string, down: string }>(
      `SELECT id, name, up, down FROM "${table}" ORDER BY id ASC`,
    )

    const lastMigration = migrations[migrations.length - 1]

    for (const migration of [...dbMigrations].sort((a, b) => b.id - a.id)) {
      if (
        !migrations.some(x => x.id === migration.id)
        || (force && lastMigration && migration.id === lastMigration.id)
      ) {
        log.info('Running down migration %s: %s', migration.id, migration.name)
        this.exec('BEGIN')
        try {
          this.exec(migration.down)
          this.run(`DELETE FROM "${table}" WHERE id = ?`, [migration.id])
          this.exec('COMMIT')
          dbMigrations = dbMigrations.filter(x => x.id !== migration.id)
        } catch (err) {
          this.exec('ROLLBACK')
          throw err
        }
      } else {
        break
      }
    }

    // whatever survived the down pass must still be the migration we recorded.
    // a differing name means files were renumbered after being applied, so the
    // up pass would skip the file now sitting at that id
    for (const applied of dbMigrations) {
      const migration = migrations.find(x => x.id === applied.id)

      if (migration && migration.name !== applied.name) {
        throw new Error(`Migration ${applied.id} is recorded as "${applied.name}" but the file at that id is "${migration.file}". This database was migrated before the files were renumbered; roll it back or recreate it.`)
      }
    }

    const lastMigrationId = dbMigrations.length
      ? dbMigrations[dbMigrations.length - 1].id
      : 0

    // migrations only ever run forward, so anything at or below the high-water
    // mark that never got applied never will be
    for (const migration of migrations) {
      if (migration.id <= lastMigrationId && !dbMigrations.some(x => x.id === migration.id)) {
        throw new Error(`Migration "${migration.file}" was never applied but the database is already at ${lastMigrationId}. Renumber it above ${lastMigrationId}.`)
      }
    }

    for (const migration of migrations) {
      if (migration.id > lastMigrationId) {
        log.info('Running migration %s: %s', migration.id, migration.name)
        this.exec('BEGIN')
        try {
          this.exec(migration.up)
          this.run(
            `INSERT INTO "${table}" (id, name, up, down) VALUES (?, ?, ?, ?)`,
            [migration.id, migration.name, migration.up, migration.down || null],
          )
          this.exec('COMMIT')
        } catch (err) {
          this.exec('ROLLBACK')
          throw err
        }
      }
    }
  }
}

class Database {
  static refs: { db?: DatabaseWrapper } = {}

  static close () {
    if (Database.refs.db) {
      log.info('Closing database file %s', Database.refs.db.config.filename)
      Database.refs.db.close()
      delete Database.refs.db
    }
  }

  static open ({ file, ro = true }: { file: string, ro?: boolean } = { file: '', ro: true }) {
    if (Database.refs.db) throw new Error('Database already open')
    log.info('Opening database file %s %s', ro ? '(read-only)' : '(writeable)', file)

    // create path if it doesn't exist
    fs.mkdirSync(path.dirname(file), { recursive: true })

    const instance = new DatabaseWrapper(file)

    if (!ro) {
      instance.migrate({
        migrationsPath: path.join(import.meta.dirname, 'schemas'),
      })

      instance.exec('PRAGMA journal_mode = WAL;')
      instance.exec('PRAGMA foreign_keys = ON;')
    }

    Database.refs.db = instance
    db = instance
    return instance
  }
}

export const open = Database.open
export const close = Database.close

export default Database.refs
