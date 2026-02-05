import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-hydra-presets.sqlite'

let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default
let HydraFolders: typeof import('./HydraFolders.js').default
let HydraPresets: typeof import('./HydraPresets.js').default
let testUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>

describe('HydraPresets model', () => {
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

    testUser = await User.getOrCreateFromHeader('hydra_preset_tester', false, false)
  })

  it('creates and lists presets by folder', async () => {
    const folder = await HydraFolders.create({
      name: 'Party',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    const preset = await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Preset A',
      code: 'osc(10).out()',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    const presets = await HydraPresets.getByFolder(folder.folderId)
    expect(presets).toHaveLength(1)
    expect(presets[0].presetId).toBe(preset.presetId)
    expect(presets[0].name).toBe('Preset A')
  })

  it('updates preset fields and moves folder', async () => {
    const folderA = await HydraFolders.create({
      name: 'A',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    const folderB = await HydraFolders.create({
      name: 'B',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    const preset = await HydraPresets.create({
      folderId: folderA.folderId,
      name: 'Preset A',
      code: 'osc(10).out()',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    await HydraPresets.update(preset.presetId, {
      name: 'Preset B',
      code: 'noise(5).out()',
      folderId: folderB.folderId,
    })

    const presetsA = await HydraPresets.getByFolder(folderA.folderId)
    const presetsB = await HydraPresets.getByFolder(folderB.folderId)
    expect(presetsA).toHaveLength(0)
    expect(presetsB).toHaveLength(1)
    expect(presetsB[0].name).toBe('Preset B')
    expect(presetsB[0].code).toBe('noise(5).out()')
  })

  it('removes preset', async () => {
    const folder = await HydraFolders.create({
      name: 'Temp',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    const preset = await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Preset A',
      code: 'osc(10).out()',
      authorUserId: testUser.userId,
      authorName: testUser.name,
    })

    await HydraPresets.remove(preset.presetId)
    const presets = await HydraPresets.getByFolder(folder.folderId)
    expect(presets).toHaveLength(0)
  })
})
