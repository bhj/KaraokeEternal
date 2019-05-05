const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const Library = require('./Library')

// get song info (including media)
router.get('/song/:songId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const songId = parseInt(ctx.params.songId, 10)

  if (Number.isNaN(songId)) {
    ctx.throw(401, 'Invalid songId')
  }

  ctx.body = await Library.getSong(songId)
})

module.exports = router
