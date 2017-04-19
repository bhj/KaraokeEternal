import { _ERROR } from 'constants'
const pendingIds = {} // requestIDs to timeoutIDs
let nextRequestID = 0

export default function createSocketMiddleware (socket, prefix) {
  return ({ dispatch }) => {
    // dispatch incoming actions sent by the server
    socket.on('action', dispatch)

    return next => action => {
      const { type, meta } = action

      // only apply to socket.io requests
      if (!type || type.indexOf(prefix) !== 0) {
        return next(action)
      }

      const requestID = nextRequestID++

      // fire request action
      next(action)

      // error action if socket.io callback timeout
      if (!(meta && meta.requireAck === false)) {
        pending[requestID] = setTimeout(() => {
          next({
            type: type + _ERROR,
            meta: {
              error: `Server didn't respond; check network [${type}]`,
            }
          })

          delete pending[requestID]
        }, 1000)
      }

      // emit along with our acknowledgement callback (3rd arg)
      // that receives data when the server calls ctx.acknowledge(data)
      // in our case the data should be a *_SUCCESS or *_ERROR action
      socket.emit('action', action, responseAction => {
        clearTimeout(pending[requestID])
        delete pending[requestID]

        next(responseAction)
      })
    }
  }
}
