import sql from 'sqlate'
import Database from '../lib/Database.js'

const { db } = Database

export interface HydraFolder {
  folderId: number
  name: string
  authorUserId: number
  authorName: string
  sortOrder: number
  dateCreated: number
}

class HydraFolders {
  static async getAll (): Promise<HydraFolder[]> {
    const query = sql`
      SELECT *
      FROM hydraFolders
      ORDER BY sortOrder ASC, dateCreated ASC
    `
    return db.all(String(query), query.parameters)
  }

  static async getById (folderId: number): Promise<HydraFolder | undefined> {
    const query = sql`
      SELECT *
      FROM hydraFolders
      WHERE folderId = ${folderId}
    `
    return db.get(String(query), query.parameters)
  }

  static async create ({ name, authorUserId, authorName }: { name: string, authorUserId: number, authorName: string }): Promise<HydraFolder> {
    const now = Math.floor(Date.now() / 1000)

    const query = sql`
      INSERT INTO hydraFolders (name, authorUserId, authorName, sortOrder, dateCreated)
      VALUES (${name}, ${authorUserId}, ${authorName}, 0, ${now})
    `
    const res = await db.run(String(query), query.parameters)
    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid folderId after insert')
    }

    const folder = await HydraFolders.getById(res.lastID)
    if (!folder) {
      throw new Error('failed to load folder after insert')
    }

    return folder
  }

  static async update (folderId: number, { name, sortOrder }: { name?: string, sortOrder?: number }): Promise<void> {
    const fields: string[] = []
    const params: Array<string | number> = []

    if (typeof name === 'string') {
      fields.push('name = ?')
      params.push(name)
    }

    if (typeof sortOrder === 'number') {
      fields.push('sortOrder = ?')
      params.push(sortOrder)
    }

    if (fields.length === 0) return

    params.push(folderId)

    await db.run(`UPDATE hydraFolders SET ${fields.join(', ')} WHERE folderId = ?`, params)
  }

  static async remove (folderId: number): Promise<void> {
    await db.run('DELETE FROM hydraFolders WHERE folderId = ?', [folderId])
  }
}

export default HydraFolders
