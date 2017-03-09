import { BEGIN, COMMIT, REVERT } from 'redux-optimistic-ui'

const _SUCCESS = '_SUCCESS'
const _ERROR = '_ERROR'
const pendingIds = {} // transactionIDs to timeoutIDs
let nextTransactionID = 0

export default function createSocketMiddleware(socket, prefix) {
  return ({ dispatch }) => {
    // Wire socket.io to dispatch actions sent by the server.
    socket.on('action', dispatch)

    return next => action => {
      const { type, meta, payload } = action

      // only apply to socket.io requests
      if (type.indexOf(prefix) !== 0) {
        return next(action)
      }

      if (!meta || !meta.isOptimistic) {
        // emit without optimism
        socket.emit('action', action)
        return next(action)
      }

      const transactionID = nextTransactionID++
      next(Object.assign({}, action, {
        meta: {
          optimistic: {
            type: BEGIN,
            id: transactionID
          }
        }}))

      // in case socket.io callback never fires due to conn error
      const timeoutID = setTimeout(() => {
        next({
          type: type + _ERROR,
          error: 'Socket timeout; reverting optimistic action: ' + type,
          payload,
          meta: {
            optimistic: {
              type: REVERT,
              id: transactionID
            },
          },
        })
      }, 2000)

      // store reference to timer this transaction is for
      pendingIds[transactionID] = timeoutID

      // emit with optimistic flag and callback (3rd arg)
      socket.emit('action', action, error => {
        // cancel dead man's timer
        clearTimeout(pendingIds[transactionID])

        next({
          type: type + (error ? _ERROR : _SUCCESS),
          error,
          payload,
          meta: {
            // Here's the magic: if there was an error, revert the state, otherwise, commit it
            optimistic: error ? {type: REVERT, id: transactionID} : {type: COMMIT, id: transactionID}
          }
        })
      })
    }
  }
}
