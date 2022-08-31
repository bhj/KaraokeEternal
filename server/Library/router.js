const KoaRouter = require('@koa/router')
const router = KoaRouter({ prefix: '/api' })
const Media = require('../Media')

// lists underlying media for a given song
router.get('/song/:songId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const songId = parseInt(ctx.params.songId, 10)

  if (Number.isNaN(songId)) {
    ctx.throw(401, 'Invalid songId')
  }

  const res = await Media.search({ songId })

  if (!res.result.length) {
    ctx.throw(404)
  }

  ctx.body = res
})

module.exports = router
