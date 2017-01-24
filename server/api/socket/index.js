const log = require('debug')('app:socket')
const Auth = require('./auth')
const Queue = require('./queue')
const Player = require('./player')
const Prefs = require('./prefs')
const Provider = require('./provider')

let ACTION_HANDLERS = Object.assign({},
  Auth.ACTION_HANDLERS,
  Queue.ACTION_HANDLERS,
  Player.ACTION_HANDLERS,
  Prefs.ACTION_HANDLERS,
  Provider.ACTION_HANDLERS
)

module.exports = async function(ctx) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  // only one allowed action if not authenticated...
  if (!ctx.user && action.type !== Auth.SOCKET_AUTHENTICATE) {
    // callback with truthy error msg
    ctx.acknowledge('Invalid token (try signing in again)')
    return
  }

  if (!handler) {
    log('No handler for type: %s', action.type)
    return
  }

  try {
    await handler(ctx, action)
  } catch (err) {
    log('Error in handler %s: %s', action.type, err.message)
  }
}
