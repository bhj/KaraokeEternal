const log = require('debug')('app:socket')
const User = require('./user')
const Queue = require('./queue')
const Player = require('./player')
const Prefs = require('./prefs')
const Provider = require('./provider')

let ACTION_HANDLERS = Object.assign({},
  User.ACTION_HANDLERS,
  Queue.ACTION_HANDLERS,
  Player.ACTION_HANDLERS,
  Prefs.ACTION_HANDLERS,
  Provider.ACTION_HANDLERS
)

module.exports = async function(ctx) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  if (!ctx.user) {
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
