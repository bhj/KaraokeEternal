import authActions, { SOCKET_AUTHENTICATE, SOCKET_AUTHENTICATE_FAIL } from './auth'
import queueActions from './queue'
import playerActions from './player'

import _debug from 'debug'
const debug = _debug('app:socket')

let ACTION_HANDLERS = {}

ACTION_HANDLERS = Object.assign(ACTION_HANDLERS, {
  ...authActions,
  ...queueActions,
  ...playerActions,
})

export default async function(ctx, next) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  // only one allowed action if not authenticated...
  if (!ctx.user && action.type !== SOCKET_AUTHENTICATE) {
    ctx.socket.socket.emit('action', {
      type: SOCKET_AUTHENTICATE_FAIL,
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

  await next()
}
