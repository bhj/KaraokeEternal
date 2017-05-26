const log = require('debug')('app:socket')
const Library = require('./library')
const Queue = require('./queue')
const Player = require('./player')

const {
  SOCKET_AUTH_ERROR,
  _ERROR,
} = require('../constants')

// built-in api actions
let handlers = {
  Library,
  Queue,
  Player,
}

module.exports = async function (ctx) {
  const action = ctx.data
  const { type } = action
  let called = false

  if (!ctx.user) {
    return ctx.acknowledge({
      type: SOCKET_AUTH_ERROR,
      meta: {
        error: 'Invalid token (try signing in again)'
      }
    })
  }

  for (let h in handlers) {
    if (typeof handlers[h][type] === 'function') {
      called = true

      try {
        await handlers[h][type](ctx, action)
      } catch (err) {
        log(err)
        const error = `Error in ${h}.${type}: ${err.message}`

        return ctx.acknowledge({
          type: type + _ERROR,
          meta: {
            error,
          }
        })
      }
    }
  }

  if (!called) {
    log('warning: no handler for action type: %s', type)
  }
}
