const log = require('debug')('app:socket')
const Library = require('./library')
const Queue = require('./queue')
const Player = require('./player')
const Prefs = require('./prefs')
const Provider = require('./provider')

const {
  SOCKET_AUTH_ERROR,
  ACTION_ERROR,
} = require('../constants')

let SOCKET_ACTIONS = Object.assign({},
  Library,
  Queue,
  Player,
  Prefs,
  Provider
)

module.exports = async function (ctx) {
  const action = ctx.data
  const { type } = action
  const handler = SOCKET_ACTIONS[type]

  if (!ctx.user) {
    return ctx.acknowledge({
      type: SOCKET_AUTH_ERROR,
      meta: {
        error: 'Invalid token (try signing in again)'
      }
    })
  }

  if (!handler) {
    log('No handler for type: %s', type)
    return
  }

  try {
    await handler(ctx, action)
  } catch (err) {
    const error = `Error handling ${type}: ${err.message}`

    return ctx.acknowledge({
      type: ACTION_ERROR,
      meta: {
        error,
      }
    })
  }
}
