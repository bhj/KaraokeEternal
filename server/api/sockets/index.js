const SOCKET_AUTHENTICATE = 'server/SOCKET_AUTHENTICATE'
const SOCKET_AUTHENTICATE_FAIL = 'account/SOCKET_AUTHENTICATE_FAIL'

const Auth = require('./auth')
const Queue = require('./queue')
const Player = require('./player')

const debug = require('debug')('app:socket')

let ACTION_HANDLERS = Object.assign({}, Auth.ACTION_HANDLERS, Queue.ACTION_HANDLERS, Player.ACTION_HANDLERS)

module.exports = async function(ctx) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]
  // only one allowed action if not authenticated...
  if (!ctx.user && action.type !== Auth.SOCKET_AUTHENTICATE) {
    ctx.socket.socket.emit('action', {
      type: Auth.SOCKET_AUTHENTICATE_FAIL,
      payload: {message: 'Invalid token (try signing in again)'}
    })
    return
  }

  if (!handler) {
    debug('No handler for type: %s', action.type)
    return
  }

  try {
    await handler(ctx, action)
  } catch (err) {
    debug('Error in handler %s: %s', action.type, err.message)
  }
}
