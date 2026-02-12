import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-hydra-router.sqlite'

let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default
let HydraFolders: typeof import('./HydraFolders.js').default
let HydraPresets: typeof import('./HydraPresets.js').default
let router: typeof import('./router.js').default

type RouterLayer = {
  path: string
  methods: string[]
  stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>>
}

function getLayer (path: string, method: string) {
  const layer = (router as unknown as { stack: RouterLayer[] }).stack
    .find(l => l.path === path && l.methods.includes(method))
  expect(layer).toBeDefined()
  return layer as RouterLayer
}

function throwWithStatus (status: number, message?: string): never {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  throw err
}

describe('HydraPresets router', () => {
  let authorUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let otherUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let adminUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let guestUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>

  beforeAll(async () => {
    await fse.remove(TEST_DB_PATH)

    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    const UserModule = await import('../User/User.js')
    User = UserModule.default

    HydraFolders = (await import('./HydraFolders.js')).default
    HydraPresets = (await import('./HydraPresets.js')).default
    router = (await import('./router.js')).default
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

    authorUser = await User.getOrCreateFromHeader('hydra_author', false, false)
    otherUser = await User.getOrCreateFromHeader('hydra_other', false, false)
    adminUser = await User.getOrCreateFromHeader('hydra_admin', true, false)
    guestUser = await User.getOrCreateFromHeader('hydra_guest', false, true)
  })

  it('POST /api/hydra-presets/folders creates a folder', async () => {
    const layer = getLayer('/api/hydra-presets/folders', 'POST')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      request: { body: { name: 'Party' } },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await handler(ctx, async () => {})
    const folder = ctx.body as { folderId: number, name: string }
    expect(folder.folderId).toBeGreaterThan(0)
    expect(folder.name).toBe('Party')
  })

  it('POST /api/hydra-presets/folders rejects guest users', async () => {
    const layer = getLayer('/api/hydra-presets/folders', 'POST')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      request: { body: { name: 'Guests No' } },
      user: { userId: guestUser.userId, name: guestUser.name, isAdmin: false, isGuest: true },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403 })
  })

  it('POST /api/hydra-presets rejects oversized code payloads', async () => {
    const folder = await HydraFolders.create({
      name: 'Code Size',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const layer = getLayer('/api/hydra-presets', 'POST')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      request: {
        body: {
          folderId: folder.folderId,
          name: 'Too Big',
          code: 'x'.repeat(50001),
        },
      },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
  })

  it('GET /api/hydra-presets/:presetId returns a preset by id', async () => {
    const folder = await HydraFolders.create({
      name: 'Lookup Folder',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })
    const preset = await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Lookup Preset',
      code: 'osc(20).out()',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const layer = getLayer('/api/hydra-presets/:presetId', 'GET')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      params: { presetId: String(preset.presetId) },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await handler(ctx, async () => {})
    expect(ctx.body).toMatchObject({
      presetId: preset.presetId,
      name: 'Lookup Preset',
    })
  })

  it('GET /api/hydra-presets/:presetId returns 404 for missing preset', async () => {
    const layer = getLayer('/api/hydra-presets/:presetId', 'GET')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      params: { presetId: '999999' },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 404 })
  })

  it('PUT /api/hydra-presets/:presetId rejects oversized code payloads', async () => {
    const folder = await HydraFolders.create({
      name: 'Code Size',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const preset = await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Existing Preset',
      code: 'osc(10).out()',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const layer = getLayer('/api/hydra-presets/:presetId', 'PUT')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      params: { presetId: String(preset.presetId) },
      request: {
        body: {
          code: 'x'.repeat(50001),
        },
      },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 400 })
  })

  it('PUT /api/hydra-presets/:presetId forbids moving preset into another users folder', async () => {
    const authorFolder = await HydraFolders.create({
      name: 'Author Folder',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const otherFolder = await HydraFolders.create({
      name: 'Other Folder',
      authorUserId: otherUser.userId,
      authorName: otherUser.name,
    })

    const preset = await HydraPresets.create({
      folderId: authorFolder.folderId,
      name: 'Author Preset',
      code: 'osc(10).out()',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const layer = getLayer('/api/hydra-presets/:presetId', 'PUT')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      params: { presetId: String(preset.presetId) },
      request: {
        body: {
          folderId: otherFolder.folderId,
        },
      },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403 })
  })

  it('DELETE /api/hydra-presets/folders/:folderId forbids non-author', async () => {
    const folder = await HydraFolders.create({
      name: 'Secret',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const layer = getLayer('/api/hydra-presets/folders/:folderId', 'DELETE')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      params: { folderId: String(folder.folderId) },
      user: { userId: otherUser.userId, name: otherUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 403 })
  })

  it('DELETE /api/hydra-presets/folders/:folderId allows admin', async () => {
    const folder = await HydraFolders.create({
      name: 'Admin',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const layer = getLayer('/api/hydra-presets/folders/:folderId', 'DELETE')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      params: { folderId: String(folder.folderId) },
      user: { userId: adminUser.userId, name: adminUser.name, isAdmin: true, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await handler(ctx, async () => {})
    expect(ctx.body).toEqual({ success: true })
  })

  it('PUT /api/hydra-presets/folders/reorder applies all sort order updates', async () => {
    const folderA = await HydraFolders.create({
      name: 'Folder A',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })
    const folderB = await HydraFolders.create({
      name: 'Folder B',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    await HydraFolders.update(folderA.folderId, { sortOrder: 0 })
    await HydraFolders.update(folderB.folderId, { sortOrder: 1 })

    const layer = getLayer('/api/hydra-presets/folders/reorder', 'PUT')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      request: {
        body: {
          updates: [
            { id: folderA.folderId, sortOrder: 1 },
            { id: folderB.folderId, sortOrder: 0 },
          ],
        },
      },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await handler(ctx, async () => {})

    const folderAAfter = await HydraFolders.getById(folderA.folderId)
    const folderBAfter = await HydraFolders.getById(folderB.folderId)

    expect(folderAAfter?.sortOrder).toBe(1)
    expect(folderBAfter?.sortOrder).toBe(0)
    expect(ctx.body).toEqual({ success: true })
  })

  it('PUT /api/hydra-presets/reorder is atomic when one preset id is invalid', async () => {
    const folder = await HydraFolders.create({
      name: 'Atomic Folder',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const presetA = await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Preset A',
      code: 'osc(10).out()',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    const presetB = await HydraPresets.create({
      folderId: folder.folderId,
      name: 'Preset B',
      code: 'noise(2).out()',
      authorUserId: authorUser.userId,
      authorName: authorUser.name,
    })

    await HydraPresets.update(presetA.presetId, { sortOrder: 0 })
    await HydraPresets.update(presetB.presetId, { sortOrder: 1 })

    const layer = getLayer('/api/hydra-presets/reorder', 'PUT')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      request: {
        body: {
          updates: [
            { id: presetA.presetId, sortOrder: 2 },
            { id: 999999, sortOrder: 0 },
          ],
        },
      },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: throwWithStatus,
    }

    await expect(handler(ctx, async () => {})).rejects.toMatchObject({ status: 404 })

    const presetAAfter = await HydraPresets.getById(presetA.presetId)
    const presetBAfter = await HydraPresets.getById(presetB.presetId)

    expect(presetAAfter?.sortOrder).toBe(0)
    expect(presetBAfter?.sortOrder).toBe(1)
  })
})
