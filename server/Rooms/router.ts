import KoaRouter from '@koa/router'
import sql from 'sqlate'
import Database from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import Rooms, { STATUSES } from '../Rooms/Rooms.js'
import { ValidationError } from '../lib/Errors.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const log = getLogger('Rooms')
const { db } = Database
const router = new KoaRouter({ prefix: '/api/rooms' })

import { ROOM_PREFS_PUSH } from '../../shared/actionTypes.js'

// list rooms
router.get('/:roomId?', async (ctx) => {
  const roomId = ctx.params.roomId ? parseInt(ctx.params.roomId, 10) : undefined
  const status = ctx.user.isAdmin ? STATUSES : undefined
  const res = await Rooms.get(roomId, { status })

  res.result.forEach((roomId) => {
    if (ctx.user.isAdmin) {
      const room = ctx.io.sockets.adapter.rooms.get(Rooms.prefix(roomId))
      res.entities[roomId].numUsers = room ? room.size : 0
    } else {
      // only pass the 'roles' prefs key
      res.entities[roomId].prefs = res.entities[roomId].prefs?.roles ? { roles: res.entities[roomId].prefs.roles } : {}
    }
  })

  ctx.body = res
})

// create room
router.post('/', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  try {
    const res = await Rooms.set(undefined, (ctx.request as unknown as RequestWithBody).body)
    log.verbose('%s created a room (roomId: %s)', ctx.user.name, res.lastID)
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES })
})

// update room
router.put('/:roomId', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const roomId = parseInt(ctx.params.roomId, 10)

  try {
    await Rooms.set(roomId, (ctx.request as unknown as RequestWithBody).body)
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  log.verbose('%s updated a room (roomId: %s)', ctx.user.name, roomId)

  const sockets = await ctx.io.in(Rooms.prefix(roomId)).fetchSockets()

  for (const s of sockets) {
    if (s?.user.isAdmin) {
      ctx.io.to(s.id).emit('action', {
        type: ROOM_PREFS_PUSH,
        payload: await Rooms.get(roomId),
      })
    }
  }

  // send updated room list
  ctx.body = await Rooms.get(null, { status: STATUSES })
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
  ctx.body = await Rooms.get(null, { status: STATUSES })
})

export default router
