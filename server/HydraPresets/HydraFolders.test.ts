import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-hydra-folders.sqlite'

let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default
let HydraFolders: typeof import('./HydraFolders.js').default
let HydraPresets: typeof import('./HydraPresets.js').default
let testUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>

describe('HydraFolders model', () => {
  beforeAll(async () => {
    await fse.remove(TEST_DB_PATH)

    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    const UserModule = await import('../User/User.js')
    User = UserModule.default

    HydraFolders = (await import('./HydraFolders.js')).default
    HydraPresets = (await import('./HydraPresets.js')).default
  })

  afterAll(async () => {
    const Database = await import('../lib/Database.js')
    await Database.close()
    await fse.remove(TEST_DB_PATH)
  })

  beforeEach(async () => {
    await db.db?.run('DELETE FROM hydraPresets')
    await db.db?.run('DELETE FROM hydraFolders')
    await db.db?.run('DELETE FROM users')

    testUser = await User.getOrCreateFromHeader('hydra_tester', false, false)
  })

  it('creates and lists folders ordered by sortOrder', async () => {
    const first = await HydraFolders.create({
      name: 'Party',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    const second = await HydraFolders.create({
      name: 'Chill',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    await HydraFolders.update(first.folderId, { sortOrder: 1 })
    await HydraFolders.update(second.folderId, { sortOrder: 0 })

    const folders = await HydraFolders.getAll()
    expect(folders).toHaveLength(2)
    expect(folders[0].folderId).toBe(second.folderId)
    expect(folders[1].folderId).toBe(first.folderId)
  })

  it('updates folder name', async () => {
    const folder = await HydraFolders.create({
      name: 'Old Name',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    await HydraFolders.update(folder.folderId, { name: 'New Name' })
    const folders = await HydraFolders.getAll()
    expect(folders[0].name).toBe('New Name')
  })

  it('removes folder and cascade-deletes presets', async () => {
    const folder = await HydraFolders.create({
      name: 'Temp',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Preset A',
      code: 'osc(10).out()',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    await HydraFolders.remove(folder.folderId)

    const remainingFolders = await HydraFolders.getAll()
    expect(remainingFolders).toHaveLength(0)

    const presets = await HydraPresets.getByFolder(folder.folderId)
    expect(presets).toHaveLength(0)
  })
})
