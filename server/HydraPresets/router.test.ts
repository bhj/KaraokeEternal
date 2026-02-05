import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fse from 'fs-extra'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-hydra-router.sqlite'

let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default
let HydraFolders: typeof import('./HydraFolders.js').default
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

describe('HydraPresets router', () => {
  let authorUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let otherUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let adminUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>

  beforeAll(async () => {
    await fse.remove(TEST_DB_PATH)

    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    const UserModule = await import('../User/User.js')
    User = UserModule.default

    HydraFolders = (await import('./HydraFolders.js')).default
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
  })

  it('POST /api/hydra-presets/folders creates a folder', async () => {
    const layer = getLayer('/api/hydra-presets/folders', 'POST')
    const handler = layer.stack[layer.stack.length - 1]

    const ctx = {
      request: { body: { name: 'Party' } },
      user: { userId: authorUser.userId, name: authorUser.name, isAdmin: false, isGuest: false },
      body: undefined as unknown,
      throw: (status: number, message?: string) => {
        const err = new Error(message) as Error & { status: number }
        err.status = status
        throw err
      },
    }

    await handler(ctx, async () => {})
    const folder = ctx.body as { folderId: number, name: string }
    expect(folder.folderId).toBeGreaterThan(0)
    expect(folder.name).toBe('Party')
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
      throw: (status: number, message?: string) => {
        const err = new Error(message) as Error & { status: number }
        err.status = status
        throw err
      },
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
      throw: (status: number, message?: string) => {
        const err = new Error(message) as Error & { status: number }
        err.status = status
        throw err
      },
    }

    await handler(ctx, async () => {})
    expect(ctx.body).toEqual({ success: true })
  })
})
