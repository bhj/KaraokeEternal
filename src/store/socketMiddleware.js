const _SUCCESS = '_SUCCESS'
const _ERROR = '_ERROR'
const pendingIds = {} // requestIDs to timeoutIDs
let nextRequestID = 0

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

      const requestID = nextRequestID++

      // fire request action
      next(action)

      // error action if socket.io callback timeout
      pendingIds[requestID] = setTimeout(() => {
        next({
          type: type + _ERROR,
          meta: {
            error: `No response from server; check network connection (on action ${type})`,
          }
        })
      }, 2000)

      // emit with callback method (3rd arg) that is
      // called using ctx.acknowledge(action) on the server
      socket.emit('action', action, responseAction => {
        // cancel dead man's timer
        clearTimeout(pendingIds[requestID])

        // action should typically have type *_SUCCESS or *_ERROR
        return next(responseAction)
      })
    }
  }
}
