import { BEGIN, COMMIT, REVERT } from 'redux-optimistic-ui'

// optimistic actions need a transaction id to match BEGIN to COMMIT/REVERT
let transactionID = 0

export default function createSocketMiddleware (socket, prefix) {
  return store => {
    // attach handler for incoming actions (from server)
    socket.on('action', action => store.dispatch(action))

    return next => action => {
      const { type, meta } = action
      const isOptimistic = meta && !!meta.isOptimistic

      // dispatch normally if it's not a socket.io request
      if (!type || !type.startsWith(prefix)) {
        return next(action)
      }

      // dispatch optimistically?
      if (isOptimistic) {
        transactionID++

        // don't mutate action because we don't need to
        // emit this meta info to the server
        next({
          ...action,
          meta: {
            ...meta,
            optimistic: { type: BEGIN, id: transactionID }
          }
        })
      } else next(action)

      // server can respond with an action in the ack callback (3rd arg)
      socket.emit('action', action, cbAction => {
        // make sure callback response is an action
        if (typeof cbAction !== 'object' || typeof cbAction.type !== 'string') {
          return
        }

        if (isOptimistic) {
          cbAction.meta = {
            ...cbAction.meta,
            optimistic: cbAction.error ? { type: REVERT, id: transactionID } : { type: COMMIT, id: transactionID }
          }
        }

        next(cbAction)
      })
    }
  }
}
