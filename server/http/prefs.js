const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:api:prefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/prefs' })
const getPrefs = require('../lib/getPrefs')

// get preferences
router.get('/', async (ctx, next) => {
  let prefs

  // get prefs from all domains
  try {
    prefs = await getPrefs()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // if not an admin, must be firstRun...
  if (!ctx.user.isAdmin) {
    if (prefs.app && prefs.app.firstRun === true) {
      // ...and we only send app domain
      ctx.body = { app: prefs.app }
      return
    }

    // ...or else
    ctx.status = 401
    return
  }

  ctx.body = prefs
})

// set (non-path) preferences
router.put('/', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.query.domain || typeof ctx.request.body !== 'object') {
    ctx.status = 422
    ctx.body = `Invalid domain or data`
    return
  }

  const q = squel.update()
    .table('prefs')
    .where('domain = ?', ctx.query.domain)

  Object.keys(ctx.request.body).forEach(key => {
    let val = ctx.request.body[key]

    // @todo: this sucks
    if (Array.isArray(val)) {
      if (val.length) {
        // escape any double quotes
        val = val.map(v => v.replace(/"/g, '\\"'))
        // add double quotes around each element
        // and the brackets to signify an array
        val = '["' + val.join('","') + '"]'
      } else {
        val = '[]'
      }
    } else if (typeof val === 'string') {
      // force quotes
      val = `"${val}"`
    }

    q.set('data', squel.select()
      .field(`json_set(data, '$.${key}', json('${val}'))`)
      .from('prefs')
      .where('domain = ?', ctx.query.domain)
    )
  })

  // do update
  try {
    // console.log(q.toString())
    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes) {
      log('%s updated prefs in domain: %s', ctx.user.name, ctx.query.domain)
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
