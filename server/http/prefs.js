const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:prefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const getPrefs = require('../lib/getPrefs')

router.post('/prefs', async (ctx, next) => {
  // must be admin
  if (!ctx.user || !ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.query.domain || typeof ctx.request.body !== 'object') {
    ctx.status = 422
    ctx.body = `Invalid domain or data`
    return
  }

  // currently only updates one key at a time
  const keys = Object.keys(ctx.request.body)
  const domain = decodeURIComponent(ctx.query.domain)

  if (keys.length !== 1) {
    ctx.status = 422
    ctx.body = `One pref key per request required; got ${keys.length}`
    return
  }

  // validated
  let val = ctx.request.body[keys[0]]

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
  }

  // update db
  try {
    const q = squel.update()
      .table('prefs')
      .where('domain = ?', domain)
      .set('data', squel.select()
      .field(`json_set(data, '$.${keys[0]}', json('${val}'))`)
      .from('prefs')
      .where('domain = ?', domain)
    )

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes) {
      log('updated pref: %s.%s', domain, keys[0])
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // send updated prefs
  try {
    ctx.body = await getPrefs()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

router.get('/prefs', async (ctx, next) => {
  // must be admin
  if (!ctx.user || !ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // get prefs
  try {
    ctx.body = await getPrefs()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router
