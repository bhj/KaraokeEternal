import KoaRouter from '@koa/router'
import HydraFolders from './HydraFolders.js'
import HydraPresets from './HydraPresets.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const router = new KoaRouter({ prefix: '/api/hydra-presets' })

function requireUser (ctx) {
  if (!ctx.user?.userId) ctx.throw(401)
}

function parseId (value: string, ctx, label: string): number {
  const id = parseInt(value, 10)
  if (Number.isNaN(id)) ctx.throw(400, `Invalid ${label}`)
  return id
}

// Folders
router.get('/folders', async (ctx) => {
  ctx.body = await HydraFolders.getAll()
})

router.post('/folders', async (ctx) => {
  requireUser(ctx)

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

router.put('/folders/:folderId', async (ctx) => {
  requireUser(ctx)
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
  requireUser(ctx)
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

router.post('/', async (ctx) => {
  requireUser(ctx)

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

  const preset = await HydraPresets.create({
    folderId,
    name,
    code,
    authorUserId: ctx.user.userId,
    authorName: ctx.user.name ?? ctx.user.username ?? 'Unknown',
  })

  ctx.body = preset
})

router.put('/:presetId', async (ctx) => {
  requireUser(ctx)
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
  await HydraPresets.update(presetId, {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    code: typeof body.code === 'string' ? body.code : undefined,
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
    folderId: typeof body.folderId === 'number' ? body.folderId : undefined,
  })

  ctx.body = await HydraPresets.getById(presetId)
})

router.delete('/:presetId', async (ctx) => {
  requireUser(ctx)
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
