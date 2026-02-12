import sql from 'sqlate'
import Database from '../lib/Database.js'

const { db } = Database

export interface HydraPreset {
  presetId: number
  folderId: number
  name: string
  code: string
  authorUserId: number
  authorName: string
  sortOrder: number
  dateCreated: number
  dateUpdated: number
}

class HydraPresets {
  static async getAll (): Promise<HydraPreset[]> {
    const query = sql`
      SELECT *
      FROM hydraPresets
      ORDER BY sortOrder ASC, dateCreated ASC
    `
    return db.all(String(query), query.parameters)
  }

  static async getById (presetId: number): Promise<HydraPreset | undefined> {
    const query = sql`
      SELECT *
      FROM hydraPresets
      WHERE presetId = ${presetId}
    `
    return db.get(String(query), query.parameters)
  }

  static async getByFolder (folderId: number): Promise<HydraPreset[]> {
    const query = sql`
      SELECT *
      FROM hydraPresets
      WHERE folderId = ${folderId}
      ORDER BY sortOrder ASC, dateCreated ASC
    `
    return db.all(String(query), query.parameters)
  }

  static async create ({ folderId, name, code, authorUserId, authorName }: { folderId: number, name: string, code: string, authorUserId: number, authorName: string }): Promise<HydraPreset> {
    const now = Math.floor(Date.now() / 1000)

    const query = sql`
      INSERT INTO hydraPresets (folderId, name, code, authorUserId, authorName, sortOrder, dateCreated, dateUpdated)
      VALUES (${folderId}, ${name}, ${code}, ${authorUserId}, ${authorName}, 0, ${now}, ${now})
    `
    const res = await db.run(String(query), query.parameters)
    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid presetId after insert')
    }

    const preset = await HydraPresets.getById(res.lastID)
    if (!preset) {
      throw new Error('failed to load preset after insert')
    }

    return preset
  }

  static async update (presetId: number, { name, code, sortOrder, folderId }: { name?: string, code?: string, sortOrder?: number, folderId?: number }): Promise<void> {
    const now = Math.floor(Date.now() / 1000)
    let didUpdateField = false

    if (typeof name === 'string') {
      const nameQuery = sql`
        UPDATE hydraPresets
        SET name = ${name}, dateUpdated = ${now}
        WHERE presetId = ${presetId}
      `
      await db.run(String(nameQuery), nameQuery.parameters)
      didUpdateField = true
    }

    if (typeof code === 'string') {
      const codeQuery = sql`
        UPDATE hydraPresets
        SET code = ${code}, dateUpdated = ${now}
        WHERE presetId = ${presetId}
      `
      await db.run(String(codeQuery), codeQuery.parameters)
      didUpdateField = true
    }

    if (typeof sortOrder === 'number') {
      const sortOrderQuery = sql`
        UPDATE hydraPresets
        SET sortOrder = ${sortOrder}, dateUpdated = ${now}
        WHERE presetId = ${presetId}
      `
      await db.run(String(sortOrderQuery), sortOrderQuery.parameters)
      didUpdateField = true
    }

    if (typeof folderId === 'number') {
      const folderIdQuery = sql`
        UPDATE hydraPresets
        SET folderId = ${folderId}, dateUpdated = ${now}
        WHERE presetId = ${presetId}
      `
      await db.run(String(folderIdQuery), folderIdQuery.parameters)
      didUpdateField = true
    }

    if (!didUpdateField) {
      const touchQuery = sql`
        UPDATE hydraPresets
        SET dateUpdated = ${now}
        WHERE presetId = ${presetId}
      `
      await db.run(String(touchQuery), touchQuery.parameters)
    }
  }

  static async remove (presetId: number): Promise<void> {
    const query = sql`
      DELETE FROM hydraPresets
      WHERE presetId = ${presetId}
    `
    await db.run(String(query), query.parameters)
  }
}

export default HydraPresets
