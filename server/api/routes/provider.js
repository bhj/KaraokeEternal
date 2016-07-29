import KoaRouter from 'koa-router'
import Providers from '../provider/index'

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
  let row = await ctx.db.get('SELECT data FROM config WHERE domain = ?', provider+'.provider')
  let cfg = JSON.parse(row.data)

  if (! cfg.enabled) {
    ctx.status = 401
    return ctx.body = `Provider "${provider}" not enabled`
  }

  log(`Calling "${method}" method of "${provider}" provider`)
  await Providers[provider][method](ctx, cfg)
})

// list providers and their configuration
router.get('/api/provider', async (ctx, next) => {
  let cfg = {}

  // get provider config
  let rows = await ctx.db.all('SELECT * FROM config WHERE domain LIKE "%.provider"')

  rows.forEach(function(row){
    cfg[row.domain] = JSON.parse(row.data)
  })

  return ctx.body = cfg
})

export default router
