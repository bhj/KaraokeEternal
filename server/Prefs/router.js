const path = require('path')
const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:prefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/prefs' })
const getFolders = require('../lib/getFolders')
const getDriveLetters = require('../lib/getDriveLetters')
const Prefs = require('./Prefs')
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_SCAN_CANCEL,
} = require('../../constants/actions')

// start media scan
router.get('/scan', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  log(`Media scan requested by user`)
  ctx.status = 200
  process.send({ 'type': SCANNER_WORKER_SCAN })
})

// cancel media scan
router.get('/scan/cancel', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  log(`Media scan canceled by user`)
  ctx.status = 200
  process.send({ 'type': SCANNER_WORKER_SCAN_CANCEL })
})

// get preferences and media paths
router.get('/', async (ctx, next) => {
  try {
    const prefs = await Prefs.get()

    // must be admin or firstrun
    if (prefs.isFirstRun || ctx.user.isAdmin) {
      ctx.body = prefs
      return
    }

    // there are no non-admin prefs but we don't want to
    // trigger a fetch error on the frontend
    ctx.body = {}
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// set preferences
router.put('/', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (typeof ctx.request.body !== 'object') {
    ctx.status = 422
    ctx.body = `Invalid domain or data`
    return
  }

  const q = squel.update()
    .table('prefs')

  // Object.keys(ctx.request.body).forEach(key => {
  //   q.set(key, ctx.request.body[key])
  // })

  // do update
  try {
    // console.log(q.toString())
    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes) {
      log('%s updated prefs: %s', ctx.user.name, Object.keys(ctx.request.body))
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // respond with updated prefs
  try {
    ctx.body = await Prefs.get()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// add media file path
router.post('/path', async (ctx, next) => {
  const dir = decodeURIComponent(ctx.query.dir)

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!dir) {
    ctx.status = 422
    ctx.body = `Invalid path`
    return
  }

  try {
    await Prefs.addPath(dir)

    // success; return new path list
    ctx.body = await Prefs.get()

    // update library
    process.send({ 'type': SCANNER_WORKER_SCAN })
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// remove media file path
router.delete('/path/:pathId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required param
  if (typeof ctx.params.pathId === 'undefined') {
    ctx.status = 422
    ctx.body = `Missing pathId`
    return
  }

  // convert param to int
  const pathId = parseInt(ctx.params.pathId, 10)

  try {
    await Prefs.removePath(pathId)

    // success; return new path list
    ctx.body = await Prefs.get()

    // update library
    process.send({ 'type': SCANNER_WORKER_SCAN })
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// get folder listing for path browser
router.get('/path/ls', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  const dir = decodeURIComponent(ctx.query.dir)

  // windows is a special snowflake and gets an
  // extra top level of available drive letters
  if (dir === '' && process.platform === 'win32') {
    try {
      const drives = await getDriveLetters()

      ctx.body = {
        current: '',
        parent: false,
        children: drives.map(d => ({
          path: d + '\\',
          label: d,
        }))
      }
    } catch (err) {
      ctx.status = 500
      ctx.body = err.message
    }
  } else {
    const current = path.resolve(dir)
    const parent = path.resolve(dir, '../')

    try {
      // don't show hidden folders
      const list = await getFolders(dir, d => !d.startsWith('.'))
      log('%s listed path: %s', ctx.user.name, current)

      ctx.body = {
        current,
        // if at root, windows gets a special top level
        parent: parent === current ? (process.platform === 'win32' ? '' : false) : parent,
        children: list.map(d => ({
          path: d,
          label: d.replace(current + path.sep, '')
        }))
      }
    } catch (err) {
      ctx.status = 500
      ctx.body = err.message
    }
  }
})

module.exports = router
