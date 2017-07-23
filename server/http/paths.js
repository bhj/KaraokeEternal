const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:api:paths')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/paths' })
const pathUtil = require('path')

const getPaths = require('../lib/getPaths')
const getFolders = require('../lib/async/getFolders')

// get media paths
router.get('/', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  try {
    ctx.body = await getPaths()
  } catch (err) {
    console.log(err)
    ctx.status = 500
    ctx.body = err.message
  }
})

// add media path
router.post('/', async (ctx, next) => {
  const { path } = ctx.request.body

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!path) {
    ctx.status = 422
    ctx.body = `Invalid path`
    return
  }

  // @todo check if already added or if it's
  // a subfolder of an already added one

  // insert
  try {
    const q = squel.insert()
      .into('paths')
      .set('path', path)

    const { text, values } = q.toParam()
    await db.run(text, values)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // respond with updated paths
  try {
    ctx.body = await getPaths()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// remove media path
router.delete('/:pathId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.params.pathId) {
    ctx.status = 422
    ctx.body = `Invalid pathId`
    return
  }

  // delete
  try {
    const q = squel.delete()
      .from('paths')
      .where('pathId = ?', ctx.params.pathId)

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes !== 1) {
      throw new Error(`Could not remove path (changes = 0)`)
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // respond with updated prefs
  try {
    ctx.body = await getPaths()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// get folder listing for path browser
router.get('/ls', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  const dir = decodeURIComponent(ctx.query.dir)
  const current = pathUtil.resolve(dir)
  const parent = pathUtil.resolve(dir, '../')

  try {
    const list = await getFolders(dir)
    const children = list.map(d => {
      return {
        path: d,
        displayPath: d.replace(current + pathUtil.sep, '')
      }
    })

    log('%s listed folder %s', ctx.user.name, current)

    ctx.body = {
      current,
      // if at root, parent and current are the same
      parent: parent === current ? false : parent,
      // don't show hidden folders
      children: children.filter(c => !c.displayPath.startsWith('.')),
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router
