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
    if (typeof name === 'string') {
      const nameQuery = sql`
        UPDATE hydraFolders
        SET name = ${name}
        WHERE folderId = ${folderId}
      `
      await db.run(String(nameQuery), nameQuery.parameters)
    }

    if (typeof sortOrder === 'number') {
      const sortOrderQuery = sql`
        UPDATE hydraFolders
        SET sortOrder = ${sortOrder}
        WHERE folderId = ${folderId}
      `
      await db.run(String(sortOrderQuery), sortOrderQuery.parameters)
    }
  }

  static async remove (folderId: number): Promise<void> {
    const deletePresetsQuery = sql`
      DELETE FROM hydraPresets
      WHERE folderId = ${folderId}
    `
    await db.run(String(deletePresetsQuery), deletePresetsQuery.parameters)

    const deleteFolderQuery = sql`
      DELETE FROM hydraFolders
      WHERE folderId = ${folderId}
    `
    await db.run(String(deleteFolderQuery), deleteFolderQuery.parameters)
  }
}

export default HydraFolders
