const debug = require('debug')
const log = debug('app:api:library')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/library' })

const { scan, cancelScan } = require('../lib/libraryScanner')

// start media scan
router.get('/scan', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  await next()
  scan(ctx, { provider: null })
})

// cancel media scan
router.get('/scan/cancel', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  await next()
  cancelScan()
})

module.exports = router
