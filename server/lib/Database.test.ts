import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DatabaseWrapper } from './Database.js'

let migrationsPath: string
let db: DatabaseWrapper

const write = (file: string, up: string, down: string) => {
  fs.writeFileSync(path.join(migrationsPath, file), `-- Up\n${up}\n\n-- Down\n${down}\n`)
}

const applied = () => db.all<{ id: number, name: string }>('SELECT id, name FROM "migrations" ORDER BY id ASC')

const tables = () => db.all<{ name: string }>(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name != 'migrations' ORDER BY name ASC`,
).map(row => row.name)

beforeEach(() => {
  migrationsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ke-migrations-'))
  db = new DatabaseWrapper(':memory:')
})

afterEach(() => {
  db.close()
  fs.rmSync(migrationsPath, { recursive: true, force: true })
})

describe('migrate', () => {
  it('applies migrations in id order', () => {
    write('002-second.sql', 'CREATE TABLE "second" ("id" integer);', 'DROP TABLE "second";')
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')

    db.migrate({ migrationsPath })

    expect(applied()).toEqual([{ id: 1, name: 'first' }, { id: 2, name: 'second' }])
    expect(tables()).toEqual(['first', 'second'])
  })

  it('ignores files that are not migrations', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    fs.writeFileSync(path.join(migrationsPath, '.DS_Store'), 'junk')
    fs.writeFileSync(path.join(migrationsPath, 'notes.md'), 'junk')

    db.migrate({ migrationsPath })

    expect(applied()).toEqual([{ id: 1, name: 'first' }])
  })

  it('is a no-op when already up to date', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')

    db.migrate({ migrationsPath })
    db.run('INSERT INTO "first" ("id") VALUES (1)')
    db.migrate({ migrationsPath })

    expect(db.get<{ count: number }>('SELECT COUNT(*) AS count FROM "first"')?.count).toBe(1)
  })

  it('applies migrations added above the high-water mark', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    db.migrate({ migrationsPath })

    write('002-second.sql', 'CREATE TABLE "second" ("id" integer);', 'DROP TABLE "second";')
    db.migrate({ migrationsPath })

    expect(applied()).toEqual([{ id: 1, name: 'first' }, { id: 2, name: 'second' }])
  })

  it('rolls back migrations whose file is gone', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    write('002-second.sql', 'CREATE TABLE "second" ("id" integer);', 'DROP TABLE "second";')
    db.migrate({ migrationsPath })

    fs.rmSync(path.join(migrationsPath, '002-second.sql'))
    db.migrate({ migrationsPath })

    expect(applied()).toEqual([{ id: 1, name: 'first' }])
    expect(tables()).toEqual(['first'])
  })

  it('re-applies the last migration when forced', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    db.migrate({ migrationsPath })
    db.run('INSERT INTO "first" ("id") VALUES (1)')

    db.migrate({ migrationsPath, force: true })

    expect(applied()).toEqual([{ id: 1, name: 'first' }])
    expect(db.get<{ count: number }>('SELECT COUNT(*) AS count FROM "first"')?.count).toBe(0)
  })

  it('rolls back a failed migration without recording it', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    write('002-broken.sql', 'CREATE TABLE "second" ("id" integer);\nNOT VALID SQL;', 'DROP TABLE "second";')

    expect(() => db.migrate({ migrationsPath })).toThrow()

    expect(applied()).toEqual([{ id: 1, name: 'first' }])
    expect(tables()).toEqual(['first'])
  })

  it('adds a REFERENCES column with a non-NULL default to a populated table', () => {
    write('001-first.sql', 'CREATE TABLE "parent" ("id" integer PRIMARY KEY);\nCREATE TABLE "child" ("id" integer);', '')
    db.migrate({ migrationsPath })
    db.run('INSERT INTO "child" ("id") VALUES (1)')

    write('002-second.sql', 'ALTER TABLE "child" ADD COLUMN "parentId" integer NOT NULL DEFAULT 0 REFERENCES parent(id);', '')
    db.migrate({ migrationsPath })

    expect(applied()).toEqual([{ id: 1, name: 'first' }, { id: 2, name: 'second' }])
    expect(db.get<{ foreign_keys: number }>('PRAGMA foreign_keys')?.foreign_keys).toBe(1)
  })

  it('upgrades a populated v1.0 database through the real migrations', () => {
    const v1 = path.join(import.meta.dirname, 'schemas')

    for (const file of ['001-initial-schema.sql', '002-replaygain.sql', '003-queue-linked-list.sql']) {
      fs.copyFileSync(path.join(v1, file), path.join(migrationsPath, file))
    }

    db.migrate({ migrationsPath })
    db.run(`INSERT INTO users (username, password, name, isAdmin, dateCreated, dateUpdated) VALUES ('admin', '', 'Admin', 1, 0, 0)`)

    db.migrate({ migrationsPath: v1 })

    expect(db.get<{ name: string }>('SELECT r.name FROM users u JOIN roles r USING (roleId)')?.name).toBe('admin')
    expect(db.all('PRAGMA foreign_key_check')).toEqual([])
  })

  it('throws when two files claim the same id', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    write('002-media-pitch.sql', 'CREATE TABLE "pitch" ("id" integer);', 'DROP TABLE "pitch";')
    write('002-providers.sql', 'CREATE TABLE "providers" ("id" integer);', 'DROP TABLE "providers";')

    expect(() => db.migrate({ migrationsPath })).toThrow(/Duplicate migration id 2.*002-media-pitch\.sql.*002-providers\.sql/s)

    // nothing ran, so the collision can't be half-applied
    expect(applied()).toEqual([])
  })

  it('throws when an applied id was renumbered to a different migration', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    write('002-providers.sql', 'CREATE TABLE "providers" ("id" integer);', 'DROP TABLE "providers";')
    db.migrate({ migrationsPath })

    // develop's migration lands on the id ours already occupies
    fs.rmSync(path.join(migrationsPath, '002-providers.sql'))
    write('002-media-pitch.sql', 'CREATE TABLE "pitch" ("id" integer);', 'DROP TABLE "pitch";')

    expect(() => db.migrate({ migrationsPath })).toThrow(/recorded as "providers".*"002-media-pitch\.sql"/s)
  })

  it('throws when a migration is added below the high-water mark', () => {
    write('001-first.sql', 'CREATE TABLE "first" ("id" integer);', 'DROP TABLE "first";')
    write('003-third.sql', 'CREATE TABLE "third" ("id" integer);', 'DROP TABLE "third";')
    db.migrate({ migrationsPath })

    write('002-late.sql', 'CREATE TABLE "late" ("id" integer);', 'DROP TABLE "late";')

    expect(() => db.migrate({ migrationsPath })).toThrow(/"002-late\.sql" was never applied.*already at 3/s)
  })
})
