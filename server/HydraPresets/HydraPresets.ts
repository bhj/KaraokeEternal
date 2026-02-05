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
    const fields: string[] = []
    const params: Array<string | number> = []

    if (typeof name === 'string') {
      fields.push('name = ?')
      params.push(name)
    }

    if (typeof code === 'string') {
      fields.push('code = ?')
      params.push(code)
    }

    if (typeof sortOrder === 'number') {
      fields.push('sortOrder = ?')
      params.push(sortOrder)
    }

    if (typeof folderId === 'number') {
      fields.push('folderId = ?')
      params.push(folderId)
    }

    const now = Math.floor(Date.now() / 1000)
    fields.push('dateUpdated = ?')
    params.push(now)

    params.push(presetId)

    await db.run(`UPDATE hydraPresets SET ${fields.join(', ')} WHERE presetId = ?`, params)
  }

  static async remove (presetId: number): Promise<void> {
    await db.run('DELETE FROM hydraPresets WHERE presetId = ?', [presetId])
  }
}

export default HydraPresets
