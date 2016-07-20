import KoaRouter from 'koa-router'
import Providers from '../provider/index'
import rows2obj from '../utilities/rows2obj'

let debug = require('debug')
let log = debug('app:library')
let error = debug('app:library:error')
let router = KoaRouter()

// call media provider for song
router.get('/api/provider/:provider/:method', async (ctx, next) => {
  const { provider, method } = ctx.params

  if (! Providers[provider]) {
    ctx.status = 404
    return ctx.body = `Provider "${provider}" not found`
  }

  if (! Providers[provider][method]) {
    ctx.status = 404
    return ctx.body = `Method "${method}" not found in provider "${provider}"`
  }

  // get provider config
  let rows = await ctx.db.all('SELECT * FROM config WHERE domain = ?', provider)
  const config = rows2obj(rows)

  if (! config.enabled) {
    ctx.status = 401
    return ctx.body = `Provider "${provider}" not enabled`
  }

  log(`Starting method "${method}" of provider "${provider}"`)
  await Providers[provider][method](config, ctx)
  log(`Finished method "${method}" of provider "${provider}"`)
})

export default router
