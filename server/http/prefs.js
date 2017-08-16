const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:prefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/prefs' })
const getPrefs = require('../lib/getPrefs')

// get preferences
router.get('/', async (ctx, next) => {
  let prefs

  // get all keys
  try {
    prefs = await getPrefs()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // if not an admin, must be first run...
  if (!ctx.user.isAdmin) {
    if (prefs.isFirstRun !== true) {
      ctx.status = 401
      return
    }
  }

  ctx.body = prefs
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
    ctx.body = await getPrefs()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router
