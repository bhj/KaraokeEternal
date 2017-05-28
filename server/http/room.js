const db = require('sqlite')
const squel = require('squel')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const debug = require('debug')
const log = debug('app:account')

// list available rooms
router.get('/rooms', async (ctx, next) => {
  const q = squel.select()
    .from('rooms')

  if (!ctx.user.isAdmin) {
    q.where('status = ?', 'open')
  }

  // console.log(ctx._io.sockets.adapter.rooms)

  try {
    const { text, values } = q.toParam()
    ctx.body = await db.all(text, values)
  } catch (err) {
    log(err)
    ctx.status = 500
  }
})

module.exports = router
