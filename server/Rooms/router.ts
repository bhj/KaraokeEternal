import KoaRouter from '@koa/router'
import sql from 'sqlate'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import Queue from '../Queue/Queue.js'
import Rooms, { STATUSES } from '../Rooms/Rooms.js'
import { ValidationError } from '../lib/Errors.js'

interface RequestWithBody {
  body: Record<string, unknown>
}

const log = getLogger('Rooms')
const router = new KoaRouter({ prefix: '/api/rooms' })

import { ROOM_PREFS_PUSH, QUEUE_PUSH } from '../../shared/actionTypes.js'

const isRoomManagerRole = (user: any): boolean => user?.role === 'room_manager'

// list rooms
router.get(['/', '/:roomId'], (ctx) => {
  const roomId = ctx.params.roomId ? parseInt(ctx.params.roomId, 10) : undefined
  const isManager = isRoomManagerRole(ctx.user)
  // admins and managers can see closed rooms; we filter manager scope below
  const status = (ctx.user.isAdmin || isManager) ? STATUSES : undefined
  const res = Rooms.get(roomId, { status })

  // Managers see open rooms plus any closed rooms they manage
  if (!ctx.user.isAdmin && isManager) {
    const managedIds = new Set(Rooms.getManagedRoomIds(ctx.user.userId))
    const filteredResult: number[] = []
    const filteredEntities: Record<number, any> = {}

    for (const rid of res.result) {
      const r = res.entities[rid]
      if (r.status === 'open' || managedIds.has(rid)) {
        filteredResult.push(rid)
        filteredEntities[rid] = r
      }
    }

    res.result = filteredResult
    res.entities = filteredEntities
  }

  res.result.forEach((roomId) => {
    if (ctx.user.isAdmin) {
      const room = ctx.io.sockets.adapter.rooms.get(Rooms.prefix(roomId))
      res.entities[roomId].numUsers = room ? room.size : 0
    } else {
      // only pass the 'roles' prefs key
      res.entities[roomId].prefs = res.entities[roomId].prefs?.roles ? { roles: res.entities[roomId].prefs.roles } : {}

      // hide manager list from non-admins (managers don't need to know co-managers)
      delete res.entities[roomId].managers
    }
  })

  ctx.body = res
})

// create room
router.post('/', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const body = (ctx.request as unknown as RequestWithBody).body
  let lastID: number | bigint | undefined

  try {
    const res = await Rooms.set(undefined, body)
    lastID = res.lastID
    log.verbose('%s created a room (roomId: %s)', ctx.user.name, lastID)

    if (Array.isArray(body.managers) && typeof lastID === 'number') {
      Rooms.setManagers(lastID, body.managers as number[])
    }
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  // send updated room list
  ctx.body = Rooms.get(null, { status: STATUSES })
})

// update room
router.put('/:roomId', async (ctx) => {
  const roomId = parseInt(ctx.params.roomId, 10)
  const body = (ctx.request as unknown as RequestWithBody).body
  const isManagerOfRoom = isRoomManagerRole(ctx.user) && Rooms.isManager(roomId, ctx.user.userId)

  if (!ctx.user.isAdmin && !isManagerOfRoom) {
    ctx.throw(401)
  }

  // managers may only update a restricted subset of fields
  const allowedForManager = ['name', 'password', 'status', 'prefs']
  const updateBody: Record<string, unknown> = ctx.user.isAdmin
    ? body
    : Object.fromEntries(Object.entries(body).filter(([k]) => allowedForManager.includes(k)))

  try {
    await Rooms.set(roomId, updateBody)

    // only admins may change the manager set
    if (ctx.user.isAdmin && Array.isArray(body.managers)) {
      Rooms.setManagers(roomId, body.managers as number[])
    }
  } catch (err) {
    if (err instanceof ValidationError) ctx.throw(422, err.message)
    throw err
  }

  log.verbose('%s updated a room (roomId: %s)', ctx.user.name, roomId)

  const sockets = await ctx.io.in(Rooms.prefix(roomId)).fetchSockets()

  for (const s of sockets) {
    const recipientCanSee = s?.user.isAdmin
      || (s?.user.role === 'room_manager' && Rooms.isManager(roomId, s.user.userId))

    if (recipientCanSee) {
      ctx.io.to(s.id).emit('action', {
        type: ROOM_PREFS_PUSH,
        payload: Rooms.get(roomId),
      })
    }
  }

  // send updated room list
  ctx.body = Rooms.get(null, { status: STATUSES })
})

// remove room
router.delete('/:roomId', (ctx) => {
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
  db.run(String(queueQuery), queueQuery.parameters)

  // remove room (roomManagers rows cascade-delete via FK)
  const roomQuery = sql`
    DELETE FROM rooms
    WHERE roomId = ${roomId}
  `
  db.run(String(roomQuery), roomQuery.parameters)

  log.verbose('%s deleted roomId %s', ctx.user.name, roomId)

  // send updated room list
  ctx.body = Rooms.get(null, { status: STATUSES })
})

// clear room queue (admin or manager-of-room)
router.post('/:roomId/clear', (ctx) => {
  const roomId = parseInt(ctx.params.roomId, 10)

  if (Number.isNaN(roomId)) {
    ctx.throw(422, 'Invalid roomId')
  }

  const isManagerOfRoom = isRoomManagerRole(ctx.user) && Rooms.isManager(roomId, ctx.user.userId)

  if (!ctx.user.isAdmin && !isManagerOfRoom) {
    ctx.throw(401)
  }

  const removed = Rooms.clearQueue(roomId)
  log.verbose('%s cleared queue for roomId %s (%s items)', ctx.user.name, roomId, removed)

  // tell everyone in the room their queue is empty
  ctx.io.to(Rooms.prefix(roomId)).emit('action', {
    type: QUEUE_PUSH,
    payload: Queue.get(roomId),
  })

  ctx.status = 200
  ctx.body = { roomId, removed }
})

export default router
