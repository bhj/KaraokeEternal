import { verify } from 'koa-jwt' // really from jsonwebtoken
import { fetchQueue, QUEUE_UPDATE_SUCCESS } from './queue'
import _debug from 'debug'
const debug = _debug('app:socket:auth')

const SOCKET_AUTHENTICATE = 'server/SOCKET_AUTHENTICATE'
const SOCKET_AUTHENTICATE_SUCCESS = 'server/SOCKET_AUTHENTICATE_SUCCESS'
const SOCKET_AUTHENTICATE_FAIL = 'server/SOCKET_AUTHENTICATE_FAIL'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SOCKET_AUTHENTICATE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id // raw socket.io instance
    const token = payload
    let user = null

    try {
      user = await verify(token, 'shared-secret')
      ctx.socket.socket.decoded_token = user

      ctx.io.to(socketId).emit('action', {
        type: SOCKET_AUTHENTICATE_SUCCESS,
        payload: user
      })
    } catch (err) {
      ctx.io.to(socketId).emit('action', {
        type: SOCKET_AUTHENTICATE_FAIL,
        payload: {message: err.message}
      })
      return
    }

    // join socket room
    if (user.roomId) {
      ctx.socket.socket.join(user.roomId)
    }

    // to the newcomer only
    ctx.io.to(socketId).emit('action', {
      type: QUEUE_UPDATE_SUCCESS,
      payload: await fetchQueue(ctx.db, user.roomId)
    })

    debug('client %s joined room %s (%s in room)', socketId, user.roomId, ctx.socket.socket.adapter.rooms[user.roomId].length || 0)
  },
}

export default async function authActions(ctx, next) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  if (handler) await handler(ctx, action)

  await next()
}
