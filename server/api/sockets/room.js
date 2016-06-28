import { fetchQueue, QUEUE_CHANGE } from './queue'
import _debug from 'debug'
const debug = _debug('app:socket:room')

const JOIN_ROOM = 'server/JOIN_ROOM'
const JOIN_ROOM_SUCCESS = 'server/JOIN_ROOM_SUCCESS'
const LEAVE_ROOM = 'server/LEAVE_ROOM'
const LEAVE_ROOM_SUCCESS = 'server/LEAVE_ROOM_SUCCESS'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [JOIN_ROOM]: async (ctx, {payload}) => {
    let roomId = payload
    let socketId = ctx.socket.socket.id // raw socket.io instance

    ctx.socket.socket.join(roomId)

    ctx.io.to(socketId)
    ctx.io.emit('action', {
      type: JOIN_ROOM_SUCCESS,
      payload: roomId
    })

    ctx.io.in(roomId)
    ctx.io.emit('action', {
      type: QUEUE_CHANGE,
      payload: await fetchQueue(ctx.db, roomId)
    })

    debug('client %s joined room %s (%s in room)', socketId, roomId, ctx.socket.socket.adapter.rooms[roomId].length)
  },
  [LEAVE_ROOM]: async (ctx, {payload}) => {
    let roomId = payload
    let socketId = ctx.socket.socket.id // raw socket.io instance

    ctx.socket.socket.leave(roomId)

    ctx.io.to(socketId)
    ctx.io.emit('action', {
      type: LEAVE_ROOM_SUCCESS,
      payload: roomId
    })

    debug('client %s left room %s (%s in room)', socketId, roomId, ctx.socket.socket.adapter.rooms[roomId].length)
  },
}

export default async function roomActions(ctx, next) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  if (handler) await handler(ctx, action)

  await next()
}
