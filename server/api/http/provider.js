const Providers = require('../../providers')
const getPrefs = require('../../lib/getPrefs')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })

// calls a provider method
router.get('/provider/:provider/:method', async (ctx, next) => {
  const { provider, method } = ctx.params
  let cfg

  if (!Providers[provider]) {
    ctx.status = 404
    ctx.body = `Provider "${provider}" not found`
    return
  }

  if (!Providers[provider][method]) {
    ctx.status = 404
    ctx.body = `Method "${method}" not found in provider "${provider}"`
  }

  // get provider config
  try {
    cfg = await getPrefs('provider.' + provider)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  if (!cfg.enabled) {
    ctx.status = 401
    ctx.body = `Provider "${provider}" not enabled`
    return
  }

  // call it
  try {
    await Providers[provider][method](ctx, cfg)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }
})

module.exports = router
