const db = require('sqlite')
const squel = require('squel')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const log = require('../lib/logger')('Rooms')

// list available rooms
router.get('/rooms', async (ctx, next) => {
  try {
    ctx.body = await getRooms(ctx)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// create room
router.post('/rooms', async (ctx, next) => {
  const room = ctx.request.body

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  if (typeof room !== 'object' || !room.name || !room.status) {
    ctx.throw(422, 'Invalid room data')
  }

  // do insert
  const q = squel.insert()
    .into('rooms')

  Object.keys(room).forEach(key => {
    q.set(key, room[key])
  })

  q.set('dateCreated', Math.floor(Date.now() / 1000))

  const { text, values } = q.toParam()
  const res = await db.run(text, values)

  if (res.stmt.changes) {
    log.info('%s created room "%s" (roomId: %s)', ctx.user.name, room.name, res.stmt.lastID)
  }

  // send updated room list
  ctx.body = await getRooms(ctx)
})

// update room
router.put('/rooms/:roomId', async (ctx, next) => {
  const room = ctx.request.body

  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  if (!ctx.params.roomId || typeof room !== 'object') {
    ctx.throw(422, 'Invalid roomId or data')
  }

  // do update
  const q = squel.update()
    .table('rooms')
    .where('roomId = ?', ctx.params.roomId)

  Object.keys(ctx.request.body).forEach(key => {
    q.set(key, ctx.request.body[key])
  })

  const { text, values } = q.toParam()
  const res = await db.run(text, values)

  if (res.stmt.changes) {
    log.info('%s updated roomId %s', ctx.user.name, ctx.params.roomId)
  }

  // send updated room list
  ctx.body = await getRooms(ctx)
})

// remove room
router.delete('/rooms/:roomId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  if (!ctx.params.roomId) {
    ctx.throw(422, 'Invalid roomId')
  }

  // delete row
  const q = squel.delete()
    .from('rooms')
    .where('roomId = ?', ctx.params.roomId)

  const { text, values } = q.toParam()
  const res = await db.run(text, values)

  if (res.stmt.changes) {
    log.info('%s deleted roomId %s', ctx.user.name, ctx.params.roomId)
  }

  // send updated room list
  ctx.body = await getRooms(ctx)
})

module.exports = router

async function getRooms (ctx) {
  const result = []
  const entities = {}

  const q = squel.select()
    .from('rooms')
    .order('dateCreated', 'desc')

  if (!ctx.user.isAdmin) {
    q.where('status = ?', 'open')
  }

  const { text, values } = q.toParam()
  const res = await db.all(text, values)

  res.forEach(row => {
    const room = ctx.io.sockets.adapter.rooms[row.roomId]
    result.push(row.roomId)

    row.numUsers = room ? room.length : 0
    row.dateCreated = row.dateCreated.substr(0, 10)
    entities[row.roomId] = row
  })

  return { result, entities }
}
