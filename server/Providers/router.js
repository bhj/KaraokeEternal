const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:provider')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/providers' }) // plural
const Providers = require('../Providers/Providers')
const providerImports = require('./')
const Media = require('../Media')

const {
  LIBRARY_PUSH,
  PROVIDER_REQUEST_SCAN,
  PROVIDER_REQUEST_SCAN_CANCEL,
} = require('../../constants/actions')

// get provider list (ordered by priority)
router.get('/', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  try {
    ctx.body = await Providers.getAll()
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return Promise.reject(err)
  }
})

// enable/disable a provider
router.put('/enable', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.query.provider || !ctx.query.enable) {
    ctx.status = 422
    ctx.body = `Invalid data`
    return
  }

  try {
    // update db
    const q = squel.update()
      .table('providers')
      .where('name = ?', ctx.query.provider)
      .set('isEnabled = ?', ctx.query.enable === 'true' ? 1 : 0)

    const { text, values } = q.toParam()
    await db.run(text, values)

    // respond with updated providers
    ctx.body = await Providers.getAll()

    // emit library since enabled providers have changed
    ctx.io.emit('action', {
      type: LIBRARY_PUSH,
      payload: await Library.get(),
    })
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return Promise.reject(err)
  }
})

// start media scan
router.get('/scan', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  ctx.status = 200
  process.send({
    'type': PROVIDER_REQUEST_SCAN,
    'payload': ctx.query.provider,
  })
})

// cancel media scan
router.get('/scan/cancel', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  ctx.status = 200
  process.send({ 'type': PROVIDER_REQUEST_SCAN_CANCEL })
})

// export this file's router...
const routers = {
  provider: router
}

// ...and each provider's
for (const name in providerImports) {
  if (providerImports[name] && providerImports[name].router) {
    routers['provider_' + name] = providerImports[name].router
  }
}

module.exports = routers
