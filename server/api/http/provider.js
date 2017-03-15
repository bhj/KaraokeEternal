const db = require('sqlite')
const Providers = require('../../providers')
const getPrefs = require('../socket/prefs').getPrefs
const KoaRouter = require('koa-router')
const router = KoaRouter({prefix: '/api'})
const debug = require('debug')
const log = debug('app:library')
const error = debug('app:library:error')

// call media provider for song
router.get('/provider/:provider/:method', async (ctx, next) => {
  const { provider, method } = ctx.params
  let cfg

  if (! Providers[provider]) {
    ctx.status = 404
    return ctx.body = `Provider "${provider}" not found`
  }

  if (! Providers[provider][method]) {
    ctx.status = 404
    return ctx.body = `Method "${method}" not found in provider "${provider}"`
  }

  // get provider config
  try {
    cfg = await getPrefs('provider.'+provider)
  } catch(err) {
    return Promise.reject(err)
  }

  if (!cfg.enabled) {
    ctx.status = 401
    return ctx.body = `Provider "${provider}" not enabled`
  }

  await Providers[provider][method](ctx, cfg)
})

module.exports = router
