const bcrypt = require('../lib/bcrypt')
const db = require('../lib/Database').db
const sql = require('sqlate')
const KoaRouter = require('@koa/router')
const router = KoaRouter({ prefix: '/api' })
const log = require('../lib/Log')('Rooms')
const Rooms = require('../Rooms')

const BCRYPT_ROUNDS = 12
const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 50
const PASSWORD_MIN_LENGTH = 5
const STATUSES = ['open', 'closed']

// list rooms
router.get('/rooms', async (ctx, next) => {
  // non-admins can only see open rooms
  const res = await Rooms.get(ctx.user.isAdmin)

  res.result.forEach(roomId => {
    const room = ctx.io.sockets.adapter.rooms.get(Rooms.prefix(roomId))
    res.entities[roomId].numUsers = room ? room.size : 0
  })

  ctx.body = res
})

// create room
router.post('/rooms', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const { name, password, status } = ctx.request.body

  if (!name || !name.trim() || name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    ctx.throw(400, `Room name must have ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`)
  }

  if (password && password.length < PASSWORD_MIN_LENGTH) {
    ctx.throw(400, `Room password must have at least ${PASSWORD_MIN_LENGTH} characters`)
  }

  if (!status || !STATUSES.includes(status)) {
    ctx.throw(400, 'Invalid room status')
  }

  const fields = new Map()
  fields.set('name', name.trim())
  fields.set('password', password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : null)
  fields.set('status', status)
  fields.set('dateCreated', Math.floor(Date.now() / 1000))

  const query = sql`
    INSERT INTO rooms ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
    VALUES ${sql.tuple(Array.from(fields.values()))}
  `
  const res = await db.run(String(query), query.parameters)

  if (res.changes) {
    log.verbose('%s created room "%s" (roomId: %s)', ctx.user.name, name, res.lastID)
  }

  // send updated room list
  ctx.body = await Rooms.get(true)
})

// get room
router.get('/rooms/:roomId', async (ctx, next) => {
  // Only admin can fetch specific room, as password is included
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const roomId = parseInt(ctx.params.roomId, 10)
  const res = await Rooms.getRoom(roomId)

  ctx.body = res
})

// update room
router.put('/rooms/:roomId', async (ctx, next) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const { name, password, status, remoteControlQREnabled } = ctx.request.body
  const roomId = parseInt(ctx.params.roomId, 10)

  if (!name || !name.trim() || name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    ctx.throw(400, `Room name must have ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`)
  }

  if (password && password.length < PASSWORD_MIN_LENGTH) {
    ctx.throw(400, `Room password must have at least ${PASSWORD_MIN_LENGTH} characters`)
  }

  if (!status || !STATUSES.includes(status)) {
    ctx.throw(400, 'Invalid room status')
  }

  const fields = new Map()
  fields.set('name', name.trim())
  fields.set('status', status)
  fields.set('remoteControlQREnabled', remoteControlQREnabled)
  fields.set('roomId', roomId)

  // falsey value will unset password
  if (typeof password !== 'undefined') {
    fields.set('password', password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : null)
  }

  const query = sql`
    UPDATE rooms
    SET ${sql.tuple(Array.from(fields.keys()).map(sql.column))} = ${sql.tuple(Array.from(fields.values()))}
    WHERE roomId = ${roomId}
  `
  const res = await db.run(String(query), query.parameters)

  if (res.changes) {
    log.verbose('%s updated roomId %s', ctx.user.name, ctx.params.roomId)
  }

  // send updated room list
  ctx.body = await Rooms.get(true)
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

  // remove room's queue first
  const queueQuery = sql`
    DELETE FROM queue
    WHERE roomId = ${roomId}
  `
  await db.run(String(queueQuery), queueQuery.parameters)

  // remove room
  const roomQuery = sql`
    DELETE FROM rooms
    WHERE roomId = ${roomId}
  `
  await db.run(String(roomQuery), roomQuery.parameters)

  log.verbose('%s deleted roomId %s', ctx.user.name, roomId)

  // send updated room list
  ctx.body = await Rooms.get(true)
})

module.exports = router
