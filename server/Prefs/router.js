const path = require('path')
const log = require('../lib/Log')('Prefs')
const KoaRouter = require('@koa/router')
const router = KoaRouter({ prefix: '/api/prefs' })
const getFolders = require('../lib/getFolders')
const getWindowsDrives = require('../lib/getWindowsDrives')
const Prefs = require('./Prefs')
const Media = require('../Media')
const pushQueuesAndLibrary = require('../lib/pushQueuesAndLibrary')

// get all prefs (including media paths)
router.get('/', async (ctx, next) => {
  const prefs = await Prefs.get()

  // must be admin or firstrun
  if (prefs.isFirstRun || ctx.user.isAdmin) {
    ctx.body = prefs
    return
  }

  // empty response for non-admins (to avoid a fetch() error)
  ctx.body = {}
})

// add a media path
router.post('/path', async (ctx, next) => {
  const dir = decodeURIComponent(ctx.query.dir)

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  // required
  if (!dir) {
    ctx.throw(422, 'Invalid path')
  }

  const pathId = await Prefs.addPath(dir, {
    prefs: ctx.request.body,
  })

  // respond with updated prefs
  ctx.body = await Prefs.get()

  // update library
  ctx.startScanner(pathId)
})

// set media path preferences
router.put('/path/:pathId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  await Prefs.setPathData(pathId, 'prefs.', ctx.request.body)

  // respond with updated prefs
  ctx.body = await Prefs.get()
})

// remove a media path
router.delete('/path/:pathId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  await Prefs.removePath(pathId)

  // respond with updated prefs
  ctx.body = await Prefs.get()

  await Media.cleanup()

  // no need to await
  pushQueuesAndLibrary(ctx.io)
})

// scan a media path
router.get('/path/:pathId/scan', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const pathId = parseInt(ctx.params.pathId, 10)

  if (isNaN(pathId)) {
    ctx.throw(422, 'Invalid pathId')
  }

  ctx.status = 200
  ctx.startScanner(pathId)
})

// scan all media paths
router.get('/paths/scan', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  ctx.status = 200
  ctx.startScanner(true)
})

// stop scanning
router.get('/paths/scan/stop', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  ctx.status = 200
  ctx.stopScanner()
})

// get folder listing for path browser
router.get('/path/ls', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const dir = decodeURIComponent(ctx.query.dir)

  // windows is a special snowflake and gets an
  // extra top level of available drive letters
  if (dir === '' && process.platform === 'win32') {
    const drives = await getWindowsDrives()

    ctx.body = {
      current: '',
      parent: false,
      children: drives,
    }
  } else {
    const current = path.resolve(dir)
    const parent = path.resolve(dir, '../')

    const list = await getFolders(dir)
    log.verbose('%s listed path: %s', ctx.user.name, current)

    ctx.body = {
      current,
      // if at root, windows gets a special top level
      parent: parent === current ? (process.platform === 'win32' ? '' : false) : parent,
      children: list.map(p => ({
        path: p,
        label: p.replace(current + path.sep, '')
      })).filter(c => !(c.label.startsWith('.') || c.label.startsWith('/.')))
    }
  }
})

module.exports = router
