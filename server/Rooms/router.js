const db = require('sqlite')
const sql = require('sqlate')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const log = require('../lib/logger')('Rooms')
const Rooms = require('../Rooms')
const NAME_MAX_LENGTH = 50
const STATUSES = ['open', 'closed']

// list rooms
router.get('/rooms', async (ctx, next) => {
  // non-admins can only see open rooms
  const res = await Rooms.get(!ctx.user.isAdmin)

  res.result.forEach(roomId => {
    const room = ctx.io.sockets.adapter.rooms[Rooms.prefix(roomId)]
    res.entities[roomId].numUsers = room ? room.length : 0
  })

  ctx.body = res
})

// create room
router.post('/rooms', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  let { name, status } = ctx.request.body

  name = name.trim()
  status = status.trim()

  if (!name || !name.length > NAME_MAX_LENGTH) {
    ctx.throw(400, `Invalid room name (max length=${NAME_MAX_LENGTH})`)
  }

  if (!status || !STATUSES.includes(status)) {
    ctx.throw(400, 'Invalid room status')
  }

  const fields = new Map()
  fields.set('name', name)
  fields.set('status', status)
  fields.set('dateCreated', Math.floor(Date.now() / 1000))

  const query = sql`
    INSERT INTO rooms ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
    VALUES ${sql.tuple(Array.from(fields.values()))}
  `
  const res = await db.run(String(query), query.parameters)

  if (res.stmt.changes) {
    log.info('%s created room "%s" (roomId: %s)', ctx.user.name, name, res.stmt.lastID)
  }

  // send updated room list
  ctx.body = await Rooms.get(ctx)
})

// update room
router.put('/rooms/:roomId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  let { name, status } = ctx.request.body
  const roomId = parseInt(ctx.params.roomId, 10)

  name = name.trim()
  status = status.trim()

  if (!name || !name.length > NAME_MAX_LENGTH) {
    ctx.throw(400, `Invalid room name (max length=${NAME_MAX_LENGTH})`)
  }

  if (!status || !STATUSES.includes(status)) {
    ctx.throw(400, 'Invalid room status')
  }

  const fields = new Map()
  fields.set('name', name)
  fields.set('status', status)
  fields.set('roomId', roomId)

  const query = sql`
    UPDATE rooms
    SET ${sql.tuple(Array.from(fields.keys()).map(sql.column))} = ${sql.tuple(Array.from(fields.values()))}
    WHERE roomId = ${roomId}
  `
  const res = await db.run(String(query), query.parameters)

  if (res.stmt.changes) {
    log.info('%s updated roomId %s', ctx.user.name, ctx.params.roomId)
  }

  // send updated room list
  ctx.body = await Rooms.get(ctx)
})

// remove room
router.delete('/rooms/:roomId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const roomId = parseInt(ctx.params.roomId, 10)

  if (typeof roomId !== 'number') {
    ctx.throw(422, 'Invalid roomId')
  }

  const query = sql`
    DELETE FROM rooms
    WHERE roomId = ${roomId}
  `
  const res = await db.run(String(query), query.parameters)

  if (res.stmt.changes) {
    log.info('%s deleted roomId %s', ctx.user.name, roomId)
  }

  // @todo remove room's queue

  // send updated room list
  ctx.body = await Rooms.get(ctx)
})

module.exports = router
