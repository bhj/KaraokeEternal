import {BEGIN, COMMIT, REVERT} from 'redux-optimistic-ui'

const _SUCCESS = '_SUCCESS'
const _ERROR = '_ERROR'
let nextTransactionID = 0

export default function createSocketMiddleware(socket, prefix) {
  return ({ dispatch }) => {
    // Wire socket.io to dispatch actions sent by the server.
    socket.on('action', dispatch)

    return next => action => {
      const {type, meta, payload} = action

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
      next(Object.assign({}, action, {meta: {optimistic: {type: BEGIN, id: transactionID}}}))

      // emit with optimistic flag and error callback (3rd arg)
      socket.emit('action', action, error => {
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
