const KoaJwt = require('koa-jwt') // really from jsonwebtoken
const Queue = require('./queue')
const debug = require('debug')('app:socket:auth')

const SOCKET_AUTHENTICATE = 'server/SOCKET_AUTHENTICATE'
const SOCKET_AUTHENTICATE_SUCCESS = 'account/SOCKET_AUTHENTICATE_SUCCESS'
const SOCKET_AUTHENTICATE_FAIL = 'account/SOCKET_AUTHENTICATE_FAIL'

const SOCKET_DEAUTHENTICATE = 'server/SOCKET_DEAUTHENTICATE'
const SOCKET_DEAUTHENTICATE_SUCCESS = 'server/SOCKET_DEAUTHENTICATE_SUCCESS'
const SOCKET_DEAUTHENTICATE_FAIL = 'server/SOCKET_DEAUTHENTICATE_FAIL'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SOCKET_AUTHENTICATE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id // raw socket.io instance
    let user

    try {
      user = KoaJwt.verify(payload, 'shared-secret')
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
      type: Queue.QUEUE_CHANGE,
      payload: await Queue.getQueue(ctx, user.roomId)
    })
  },
  [SOCKET_DEAUTHENTICATE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id // raw socket.io instance

    if (ctx.user && ctx.user.roomId) {
      debug('%s (%s) left room %s (%s in room)', ctx.user.name, socketId, ctx.user.roomId, ctx.socket.socket.adapter.rooms[ctx.user.roomId].length-1 || 0)
      ctx.socket.socket.leave(ctx.user.roomId)
    }
  },
}

module.exports = {
  ACTION_HANDLERS,
  SOCKET_AUTHENTICATE,
}
