export default function createSocketMiddleware (socket, prefix) {
  return store => {
    // dispatch incoming actions sent by the server
    socket.on('action', action => {
      const { type } = action

      // can ignore player commands if we're not an active player
      if (type.startsWith('player/') && !store.getState().player) {
        return
      }

      store.dispatch(action)
    })

    return next => action => {
      const { type } = action

      // only apply to socket.io requests
      if (!type.startsWith(prefix)) {
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
