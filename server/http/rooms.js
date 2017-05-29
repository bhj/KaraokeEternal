const db = require('sqlite')
const squel = require('squel')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const debug = require('debug')
const log = debug('app:room')

// list available rooms
router.get('/rooms', async (ctx, next) => {
  let rows
  const q = squel.select()
    .from('rooms')

  if (!ctx.user.isAdmin) {
    q.where('status = ?', 'open')
  }

  // console.log(ctx._io.sockets.adapter.rooms)

  try {
    const { text, values } = q.toParam()
    rows = await db.all(text, values)
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  rows.forEach(row => {
    row.numOccupants = 0
  })

  ctx.body = rows
})

module.exports = router
