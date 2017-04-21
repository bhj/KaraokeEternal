export default function createSocketMiddleware (socket, prefix) {
  return ({ dispatch }) => {
    // dispatch incoming actions sent by the server
    socket.on('action', dispatch)

    return next => action => {
      const { type } = action

      // only apply to socket.io requests
      if (!type || type.indexOf(prefix) !== 0) {
        return next(action)
      }

      // fire request action
      next(action)

      // emit action along with ack callback (3rd arg)
      // that can optionally receive data when server
      // calls ctx.acknowledge(data)
      socket.emit('action', action, cbData => {
        if (typeof cbData === 'object') {
          // assume it's an action
          next(cbData)
        }
      })
    }
  }
}
