import path from 'path'
import sql from 'sqlate'
import crypto from 'crypto'
import type { Path, Provider, ProviderPrefs, ProviderTypePrefs, SongProviderPrefs } from '../../shared/types.js'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'

const RESERVED_KEYS = ['jwtKey', 'isFirstRun']
const log = getLogger('Prefs')

// provider prefs as stored in the data column (validated on write)
interface StoredProviderPrefs {
  enabled?: boolean
  types?: { song?: Partial<SongProviderPrefs> }
}

/**
 * Provider prefs built from known keys only, so they're safe to expose to
 * non-admins. A type with no stored entry is left out (disabled).
 */
function buildProviderPrefs (stored: StoredProviderPrefs | undefined): ProviderPrefs {
  const types: ProviderTypePrefs = {}
  const song = stored?.types?.song

  if (song) {
    types.song = { enabled: song.enabled ?? false, maxLibraryResults: song.maxLibraryResults ?? null }
  }

  return { enabled: stored?.enabled ?? true, types }
}

class Prefs {
  /**
   * Get all global preferences (includes media paths; excludes JWT secret key)
   */
  static get () {
    const prefs: {
      paths: { result: number[], entities: Record<number, Path> }
      providers: { result: number[], entities: Record<number, Provider> }
      roles: { result: number[], entities: Record<number, { roleId: number, name: string }> }
      [key: string]: unknown
    } = {
      paths: { result: [], entities: {} },
      providers: { result: [], entities: {} },
      roles: { result: [], entities: {} },
    }

    {
      const query = sql`
        SELECT * FROM prefs
        WHERE key != 'jwtKey'
      `
      const rows = db.all<{ key: string, data: string }>(String(query), query.parameters)

      // json-decode key/val pairs
      rows.forEach((row) => {
        prefs[row.key] = JSON.parse(row.data)
      })
    }

    // include roles
    {
      const query = sql`
        SELECT roleId, name
        FROM roles
      `
      const rows = db.all<{ roleId: number, name: string }>(String(query), query.parameters)

      for (const row of rows) {
        prefs.roles.entities[row.roleId] = row
        prefs.roles.result.push(row.roleId)
      }
    }

    // include media paths
    {
      const query = sql`
        SELECT * FROM paths
        ORDER BY priority
      `
      const rows = db.all<{ pathId: number, path: string, priority: number, data: string }>(String(query), query.parameters)

      for (const row of rows) {
        const data = JSON.parse(row.data)
        delete row.data
        prefs.paths.entities[row.pathId] = { ...row, ...data }
        prefs.paths.result.push(row.pathId)
      }
    }

    // include providers
    {
      const query = sql`
        SELECT * FROM providers
        ORDER BY priority
      `
      const rows = db.all<{ providerId: number, name: string, url: string, priority: number, data: string }>(String(query), query.parameters)

      for (const row of rows) {
        const { prefs: storedPrefs, ...data } = JSON.parse(row.data)
        delete row.data

        // columns win so a stray data key can't shadow them (e.g. url)
        prefs.providers.entities[row.providerId] = { ...data, ...row, prefs: buildProviderPrefs(storedPrefs) }
        prefs.providers.result.push(row.providerId)
      }
    }

    return prefs
  }

  /**
   * Enabled providers, whitelisted to fields safe for non-admin users
   * (entities can hold url, apiKey, and other stored provider config)
   */
  static getSanitizedProviders (providers: { result: number[], entities: Record<number, Provider> }) {
    const result = providers.result.filter(id => providers.entities[id].prefs.enabled)

    return {
      result,
      entities: Object.fromEntries(result.map((id) => {
        const { providerId, name, priority, prefs } = providers.entities[id]
        return [id, { providerId, name, priority, prefs }]
      })),
    }
  }

  /**
   * Set a global preference
   * @param key - the preference key
   * @param data - the value to be JSON-encoded
   * @return Success/fail boolean
   */
  static set (key: string, data: unknown): boolean {
    if (RESERVED_KEYS.includes(key)) {
      throw new Error(`Cannot set reserved pref key: ${key}`)
    }

    const query = sql`
      REPLACE INTO prefs (key, data)
      VALUES (${key}, ${JSON.stringify(data)})
    `
    const res = db.run(String(query), query.parameters)
    return res.changes === 1
  }

  /**
   * Add media path
   * @param dir - an absolute path
   * @param data - the object to be JSON-encoded
   * @return the newly-added path's pathId
   */
  static addPath (dir: string, data?: object): number {
    const prefs = Prefs.get()
    const { result, entities } = prefs.paths
    const candidate = path.resolve(dir)

    // Reject any nesting (either direction) or exact duplicate after normalization.
    // resolvePathId() depends on this invariant to return a unique match.
    for (const pathId of result) {
      const existing = path.resolve(entities[pathId].path)
      if (candidate === existing) {
        throw new Error('Folder has already been added')
      }
      const childRel = path.relative(existing, candidate)
      if (!childRel.startsWith('..' + path.sep) && childRel !== '..' && !path.isAbsolute(childRel)) {
        throw new Error('Folder is inside an existing media path')
      }
      const parentRel = path.relative(candidate, existing)
      if (!parentRel.startsWith('..' + path.sep) && parentRel !== '..' && !path.isAbsolute(parentRel)) {
        throw new Error('Folder contains an existing media path')
      }
    }

    const fields = new Map()
    fields.set('path', candidate)
    // priority defaults to one higher than current highest
    fields.set('priority', result.length ? entities[result[result.length - 1]].priority + 1 : 0)
    if (data) fields.set('data', JSON.stringify(data))

    const query = sql`
      INSERT INTO paths ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = db.run(String(query), query.parameters)

    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid lastID from path insert')
    }

    return res.lastID
  }

  /**
   * Remove a media path
   */
  static removePath (pathId: number): void {
    const query = sql`
      DELETE FROM paths
      WHERE pathId = ${pathId}
    `
    db.run(String(query), query.parameters)
  }

  /**
   * Set media path priorities
   */
  static setPathPriority (pathIds: number[]): void {
    if (!Array.isArray(pathIds)) {
      throw new Error('pathIds must be an array')
    }

    const query = sql`
      UPDATE paths
        SET priority = CASE pathId
          ${sql.concat(pathIds.map((pathId, i) => sql`WHEN ${pathId} THEN ${i} `))}
        END
      WHERE pathId IN ${sql.tuple(pathIds)}
      `
    db.run(String(query), query.parameters)
  }

  /**
   * Resolve an absolute filesystem path to its configured library pathId.
   * Returns null if `absPath` lies outside every configured base, or — defensively —
   * if a legacy database has nested bases that both contain it (current
   * `addPath` rejects nesting in both directions, so this is unreachable for
   * fresh databases).
   */
  static resolvePathId (absPath: string): number | null {
    if (!path.isAbsolute(absPath)) return null
    const resolved = path.resolve(absPath)
    const paths = this.get().paths.entities as Record<number, Path>
    let match: number | null = null
    for (const [idStr, entity] of Object.entries(paths)) {
      const base = path.resolve(entity.path)
      const rel = path.relative(base, resolved)
      const inside = rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel))
      if (!inside) continue
      if (match !== null) {
        log.warn('resolvePathId: multiple configured bases contain %s (legacy nested paths?)', resolved)
        return null
      }
      match = Number(idStr)
    }
    return match
  }

  /**
   * Set a path's JSON data
   * @param keyPrefix - key prefix; e.g. `prefs.`
   * @param data - key:value pair to set
   * @todo Currently only supports one key:value pair at a time
   */
  static setPathData (pathId: number, keyPrefix: string = '', data: object): void {
    const keys = Object.keys(data).map(key => `$.${keyPrefix}${key}`)
    const values = Object.values(data)

    const query = sql`
      UPDATE paths
      SET data = json_set(data, ${keys[0]}, json(${JSON.stringify(values[0])}))
      WHERE pathId = ${pathId}
    `
    db.run(String(query), query.parameters)
  }

  /**
   * Add provider
   */
  static addProvider (name: string, url: string, data?: object): number {
    const prefs = Prefs.get()
    const { result, entities } = prefs.providers

    const fields = new Map()
    fields.set('name', name)
    fields.set('url', url)
    fields.set('priority', result.length ? entities[result[result.length - 1]].priority + 1 : 0)
    if (data) fields.set('data', JSON.stringify(data))

    const query = sql`
      INSERT INTO providers ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = db.run(String(query), query.parameters)

    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid lastID from provider insert')
    }

    return res.lastID
  }

  /**
   * Remove a provider
   */
  static removeProvider (providerId: number): void {
    const query = sql`
      DELETE FROM providers
      WHERE providerId = ${providerId}
    `
    db.run(String(query), query.parameters)
  }

  /**
   * Set provider priorities
   */
  static setProviderPriority (providerIds: number[]): void {
    if (!Array.isArray(providerIds)) {
      throw new Error('providerIds must be an array')
    }

    const query = sql`
      UPDATE providers
        SET priority = CASE providerId
          ${sql.concat(providerIds.map((providerId, i) => sql`WHEN ${providerId} THEN ${i} `))}
        END
      WHERE providerId IN ${sql.tuple(providerIds)}
      `
    db.run(String(query), query.parameters)
  }

  /**
   * Update a provider's name, url, and/or JSON data fields
   */
  static updateProvider (providerId: number, fields: Record<string, unknown>): void {
    const { name, url, ...dataFields } = fields

    if (name !== undefined) {
      const query = sql`UPDATE providers SET name = ${name} WHERE providerId = ${providerId}`
      db.run(String(query), query.parameters)
    }

    if (url !== undefined) {
      const query = sql`UPDATE providers SET url = ${url} WHERE providerId = ${providerId}`
      db.run(String(query), query.parameters)
    }

    if (Object.keys(dataFields).length > 0) {
      // json_patch merges nested objects, so a partial prefs object keeps the
      // other stored prefs. A null value removes its key (RFC 7396); that is
      // what makes `maxLibraryResults: null` work, since buildProviderPrefs
      // reads a missing key back as null. Validation rejects null elsewhere.
      const query = sql`
        UPDATE providers
        SET data = json_patch(data, ${JSON.stringify(dataFields)})
        WHERE providerId = ${providerId}
      `
      db.run(String(query), query.parameters)
    }
  }

  /**
   * Get JWT secret key from db
   * @return the current or newly-generated key
   */
  static getJwtKey (forceRotate: boolean = false): string {
    if (forceRotate) return this.rotateJwtKey()

    const query = sql`
      SELECT * FROM prefs
      WHERE key = 'jwtKey'
    `
    const row = db.get<{ key: string, data: string }>(String(query), query.parameters)

    if (row && row.data) {
      const jwtKey = JSON.parse(row.data)
      if (jwtKey.length === 64) return jwtKey
    }

    return this.rotateJwtKey()
  }

  /**
   * Create or rotate JWT secret key
   */
  static rotateJwtKey (): string {
    const jwtKey = crypto.randomBytes(48).toString('base64') // 64 char
    log.info('Rotating JWT secret key (length=%s)', jwtKey.length)

    const query = sql`
      REPLACE INTO prefs (key, data)
      VALUES ('jwtKey', ${JSON.stringify(jwtKey)})
    `
    const res = db.run(String(query), query.parameters)

    if (!res.changes) {
      throw new Error('Unable to update JWT secret key')
    }

    return jwtKey
  }
}

export default Prefs
