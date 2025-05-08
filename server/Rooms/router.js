import KoaRouter from '@koa/router'
import sql from 'sqlate'
import Database from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import Rooms, { STATUSES } from '../Rooms/Rooms.js'
import { ValidationError } from '../lib/Errors.js'

const log = getLogger('Rooms')
const { db } = Database
const router = new KoaRouter({ prefix: '/api/rooms' })

import { ROOM_PREFS_PUSH } from '../../shared/actionTypes.js'

// list rooms
router.get('/:roomId?', async (ctx) => {
  const roomId = ctx.params.roomId ? parseInt(ctx.params.roomId, 10) : undefined
  const status = ctx.user.isAdmin ? STATUSES : undefined
  const res = await Rooms.get(roomId, { status, prefs: ctx.user.isAdmin })

  res.result.forEach((roomId) => {
    const room = ctx.io.sockets.adapter.rooms.get(Rooms.prefix(roomId))
    res.entities[roomId].numUsers = room ? room.size : 0
  })

  ctx.body = res
})

// create room
router.post('/', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  try {
    const res = await Rooms.set(undefined, ctx.request.body)
    log.verbose('%s created a room (roomId: %s)', ctx.user.name, res.lastID)
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES, prefs: true })
})

// update room
router.put('/:roomId', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const roomId = parseInt(ctx.params.roomId, 10)

  try {
    await Rooms.set(roomId, ctx.request.body)
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  log.verbose('%s updated a room (roomId: %s)', ctx.user.name, ctx.params.roomId)

  for (const sock of ctx.io.of('/').sockets.values()) {
    if (sock?.user?.isAdmin && sock?.user.roomId === roomId) {
      ctx.io.to(sock.id).emit('action', {
        type: ROOM_PREFS_PUSH,
        payload: await Rooms.get(roomId, { prefs: true }),
      })
    }
  }

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES, prefs: true })
})

// remove room
router.delete('/:roomId', async (ctx) => {
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
  ctx.body = await Rooms.get(null, { status: STATUSES, prefs: true })
})

export default router
