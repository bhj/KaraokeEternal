const debug = require('debug')
const log = debug('app:provider')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider' })
const Providers = require('../Providers/Providers')
const providerImports = require('./')

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

  if (Providers.isScanning()) {
    ctx.status = 500
    ctx.body = 'Media scan already in progress'
    return
  }

  // let middleware finish and send 200 response...
  await next()

  // ...then do the heavy lifting
  Providers.startScan(ctx)
})

// cancel media scan
router.get('/scan/cancel', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  await next()
  Providers.cancelScan()
})

// export this file's router...
const routers = {
  provider: router
}

// ... and each provider's
for (const name in providerImports) {
  if (providerImports[name] && providerImports[name].Router) {
    routers['provider_' + name] = providerImports[name].Router
  }
}

module.exports = routers
