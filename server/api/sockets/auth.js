import { verify } from 'koa-jwt' // really from jsonwebtoken
import { getQueue, QUEUE_CHANGE } from './queue'
import _debug from 'debug'
const debug = _debug('app:socket:auth')

export const SOCKET_AUTHENTICATE = 'server/SOCKET_AUTHENTICATE'
export const SOCKET_AUTHENTICATE_SUCCESS = 'account/SOCKET_AUTHENTICATE_SUCCESS'
export const SOCKET_AUTHENTICATE_FAIL = 'account/SOCKET_AUTHENTICATE_FAIL'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SOCKET_AUTHENTICATE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id // raw socket.io instance
    const token = payload
    let user

    try {
      user = verify(token, 'shared-secret')
    } catch (err) {
      ctx.io.to(socketId).emit('action', {
        type: SOCKET_AUTHENTICATE_FAIL,
        payload: {message: err.message}
      })
      return
    }

    // successful authentication
    ctx.socket.socket.decoded_token = user

    ctx.io.to(socketId).emit('action', {
      type: SOCKET_AUTHENTICATE_SUCCESS,
      payload: user
    })

    // join socket room
    if (user.roomId) {
      ctx.socket.socket.join(user.roomId)
    }

    debug('%s (%s) joined room %s (%s in room)', user.name, socketId, user.roomId, ctx.socket.socket.adapter.rooms[user.roomId].length || 0)

    // success! send status to newcomer only
    ctx.io.to(socketId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx, user.roomId)
    })
  },
}

export default ACTION_HANDLERS
