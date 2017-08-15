const debug = require('debug')
const log = debug('app:provider')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider' })
const Providers = require('../Providers/Providers')
const providerImports = require('./')
const { PROVIDER_REQUEST_SCAN, PROVIDER_REQUEST_SCAN_CANCEL } = require('../../actions')

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

// start media scan
router.get('/scan', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  ctx.status = 200
  process.send({ 'type': PROVIDER_REQUEST_SCAN })
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

// ... and each provider's
for (const name in providerImports) {
  if (providerImports[name] && providerImports[name].router) {
    routers['provider_' + name] = providerImports[name].router
  }
}

module.exports = routers
