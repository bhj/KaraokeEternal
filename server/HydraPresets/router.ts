import KoaRouter from '@koa/router'
import sql from 'sqlate'
import Database from '../lib/Database.js'
import HydraFolders from './HydraFolders.js'
import HydraPresets from './HydraPresets.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

interface SortOrderUpdate {
  id: number
  sortOrder: number
}

const router = new KoaRouter({ prefix: '/api/hydra-presets' })
const MAX_PRESET_CODE_LENGTH = 50_000
const { db } = Database

function requireUser (ctx, { nonGuest = false }: { nonGuest?: boolean } = {}) {
  if (!ctx.user?.userId) ctx.throw(401)
  if (nonGuest && ctx.user.isGuest) ctx.throw(403, 'Guests cannot manage presets')
}

function parseId (value: string, ctx, label: string): number {
  const id = parseInt(value, 10)
  if (Number.isNaN(id)) ctx.throw(400, `Invalid ${label}`)
  return id
}

function parseSortOrderUpdates (ctx): SortOrderUpdate[] {
  const body = (ctx.request as unknown as RequestWithBody).body as {
    updates?: unknown
  }

  if (!Array.isArray(body.updates) || body.updates.length === 0) {
    ctx.throw(400, 'Invalid updates payload')
  }

  const updatesRaw = body.updates as unknown[]
  const updates: SortOrderUpdate[] = []
  for (const item of updatesRaw) {
    if (typeof item !== 'object' || item === null) ctx.throw(400, 'Invalid updates payload')

    const update = item as { id?: unknown, sortOrder?: unknown }
    if (!Number.isInteger(update.id) || !Number.isFinite(update.sortOrder as number)) {
      ctx.throw(400, 'Invalid updates payload')
    }

    updates.push({ id: update.id as number, sortOrder: update.sortOrder as number })
  }

  return updates
}

async function withTransaction (ctx, fn: () => Promise<void>): Promise<void> {
  if (!db) ctx.throw(500, 'Database not initialized')

  await db.exec('BEGIN IMMEDIATE TRANSACTION')
  try {
    await fn()
    await db.exec('COMMIT')
  } catch (err) {
    try {
      await db.exec('ROLLBACK')
    } catch {
      // no-op
    }
    throw err
  }
}

// Folders
router.get('/folders', async (ctx) => {
  ctx.body = await HydraFolders.getAll()
})

router.post('/folders', async (ctx) => {
  requireUser(ctx, { nonGuest: true })

  const body = (ctx.request as unknown as RequestWithBody).body as { name?: unknown }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) ctx.throw(400, 'Invalid name')

  const folder = await HydraFolders.create({
    name,
    authorUserId: ctx.user.userId,
    authorName: ctx.user.name ?? ctx.user.username ?? 'Unknown',
  })

  ctx.body = folder
})

router.put('/folders/reorder', async (ctx) => {
  requireUser(ctx, { nonGuest: true })
  const updates = parseSortOrderUpdates(ctx)

  for (const update of updates) {
    const folder = await HydraFolders.getById(update.id)
    if (!folder) ctx.throw(404, 'Folder not found')

    if (!ctx.user.isAdmin && ctx.user.userId !== folder.authorUserId) {
      ctx.throw(403)
    }
  }

  await withTransaction(ctx, async () => {
    for (const update of updates) {
      const query = sql`
        UPDATE hydraFolders
        SET sortOrder = ${update.sortOrder}
        WHERE folderId = ${update.id}
      `
      const res = await db.run(String(query), query.parameters)
      if (!res.changes) ctx.throw(404, 'Folder not found')
    }
  })

  ctx.body = { success: true }
})

router.put('/folders/:folderId', async (ctx) => {
  requireUser(ctx, { nonGuest: true })
  const folderId = parseId(ctx.params.folderId, ctx, 'folderId')

  const folder = await HydraFolders.getById(folderId)
  if (!folder) ctx.throw(404, 'Folder not found')

  if (!ctx.user.isAdmin && ctx.user.userId !== folder.authorUserId) {
    ctx.throw(403)
  }

  const body = (ctx.request as unknown as RequestWithBody).body as {
    name?: unknown
    sortOrder?: unknown
  }
  await HydraFolders.update(folderId, {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
  })

  ctx.body = await HydraFolders.getById(folderId)
})

router.delete('/folders/:folderId', async (ctx) => {
  requireUser(ctx, { nonGuest: true })
  const folderId = parseId(ctx.params.folderId, ctx, 'folderId')

  const folder = await HydraFolders.getById(folderId)
  if (!folder) ctx.throw(404, 'Folder not found')

  if (!ctx.user.isAdmin && ctx.user.userId !== folder.authorUserId) {
    ctx.throw(403)
  }

  await HydraFolders.remove(folderId)
  ctx.body = { success: true }
})

// Presets
router.get('/', async (ctx) => {
  ctx.body = await HydraPresets.getAll()
})

router.get('/folder/:folderId', async (ctx) => {
  const folderId = parseId(ctx.params.folderId, ctx, 'folderId')
  ctx.body = await HydraPresets.getByFolder(folderId)
})

router.get('/:presetId', async (ctx) => {
  const presetId = parseId(ctx.params.presetId, ctx, 'presetId')
  const preset = await HydraPresets.getById(presetId)
  if (!preset) ctx.throw(404, 'Preset not found')
  ctx.body = preset
})

router.post('/', async (ctx) => {
  requireUser(ctx, { nonGuest: true })

  const body = (ctx.request as unknown as RequestWithBody).body as {
    folderId?: unknown
    name?: unknown
    code?: unknown
  }
  const folderId = typeof body.folderId === 'number' ? body.folderId : null
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const code = typeof body.code === 'string' ? body.code : ''
  if (folderId === null) ctx.throw(400, 'Invalid folderId')
  if (!name) ctx.throw(400, 'Invalid name')
  if (!code.trim()) ctx.throw(400, 'Invalid code')
  if (code.length > MAX_PRESET_CODE_LENGTH) ctx.throw(400, 'Code too large')

  const targetFolder = await HydraFolders.getById(folderId)
  if (!targetFolder) ctx.throw(404, 'Folder not found')
  if (!ctx.user.isAdmin && targetFolder.authorUserId !== ctx.user.userId) {
    ctx.throw(403)
  }

  const preset = await HydraPresets.create({
    folderId,
    name,
    code,
    authorUserId: ctx.user.userId,
    authorName: ctx.user.name ?? ctx.user.username ?? 'Unknown',
  })

  ctx.body = preset
})

router.put('/reorder', async (ctx) => {
  requireUser(ctx, { nonGuest: true })
  const updates = parseSortOrderUpdates(ctx)

  let rootFolderId: number | null = null
  for (const update of updates) {
    const preset = await HydraPresets.getById(update.id)
    if (!preset) ctx.throw(404, 'Preset not found')

    if (!ctx.user.isAdmin && ctx.user.userId !== preset.authorUserId) {
      ctx.throw(403)
    }

    if (rootFolderId === null) {
      rootFolderId = preset.folderId
    } else if (preset.folderId !== rootFolderId) {
      ctx.throw(400, 'All presets in a reorder request must belong to the same folder')
    }
  }

  const now = Math.floor(Date.now() / 1000)

  await withTransaction(ctx, async () => {
    for (const update of updates) {
      const query = sql`
        UPDATE hydraPresets
        SET sortOrder = ${update.sortOrder},
            dateUpdated = ${now}
        WHERE presetId = ${update.id}
      `
      const res = await db.run(String(query), query.parameters)
      if (!res.changes) ctx.throw(404, 'Preset not found')
    }
  })

  ctx.body = { success: true }
})

router.put('/:presetId', async (ctx) => {
  requireUser(ctx, { nonGuest: true })
  const presetId = parseId(ctx.params.presetId, ctx, 'presetId')

  const preset = await HydraPresets.getById(presetId)
  if (!preset) ctx.throw(404, 'Preset not found')

  if (!ctx.user.isAdmin && ctx.user.userId !== preset.authorUserId) {
    ctx.throw(403)
  }

  const body = (ctx.request as unknown as RequestWithBody).body as {
    name?: unknown
    code?: unknown
    sortOrder?: unknown
    folderId?: unknown
  }

  const folderId = typeof body.folderId === 'number' ? body.folderId : undefined
  const code = typeof body.code === 'string' ? body.code : undefined

  if (typeof code === 'string' && !code.trim()) ctx.throw(400, 'Invalid code')
  if (typeof code === 'string' && code.length > MAX_PRESET_CODE_LENGTH) ctx.throw(400, 'Code too large')

  if (typeof folderId === 'number') {
    const targetFolder = await HydraFolders.getById(folderId)
    if (!targetFolder) ctx.throw(404, 'Folder not found')
    if (!ctx.user.isAdmin && targetFolder.authorUserId !== ctx.user.userId) {
      ctx.throw(403)
    }
  }

  await HydraPresets.update(presetId, {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    code,
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
    folderId,
  })

  ctx.body = await HydraPresets.getById(presetId)
})

router.delete('/:presetId', async (ctx) => {
  requireUser(ctx, { nonGuest: true })
  const presetId = parseId(ctx.params.presetId, ctx, 'presetId')

  const preset = await HydraPresets.getById(presetId)
  if (!preset) ctx.throw(404, 'Preset not found')

  if (!ctx.user.isAdmin && ctx.user.userId !== preset.authorUserId) {
    ctx.throw(403)
  }

  await HydraPresets.remove(presetId)
  ctx.body = { success: true }
})

export default router
