const log = require('debug')(`app:server [${process.pid}]`)
const jwtVerify = require('jsonwebtoken').verify

const LibrarySocket = require('./Library/socket')
const QueueSocket = require('./Queue/socket')
const PlayerSocket = require('./Player/socket')
const Library = require('./Library')
const Queue = require('./Queue')
const parseCookie = require('./lib/parseCookie')

const {
  LIBRARY_PUSH,
  QUEUE_PUSH,
  PLAYER_STATUS,
  PLAYER_LEAVE,
  SOCKET_AUTH_ERROR,
  _ERROR,
} = require('../constants/actions')

const handlers = {
  ...LibrarySocket,
  ...QueueSocket,
  ...PlayerSocket,
}

module.exports = function (io, jwtKey) {
  io.on('connection', async (sock) => {
    const { kfToken } = parseCookie(sock.handshake.headers.cookie)

    // decode JWT in cookie sent with socket handshake
    try {
      sock.user = jwtVerify(kfToken, jwtKey)
    } catch (err) {
      io.to(sock.id).emit('action', {
        type: SOCKET_AUTH_ERROR,
      })

      sock.user = null
      sock.disconnect()
      log(err)
      return
    }

    // attach disconnect handler
    sock.on('disconnect', (reason) => {
      if (!sock.user || !sock.user.roomId) {
        return
      }

      const room = sock.adapter.rooms[sock.user.roomId] || []

      log('%s (%s) left room %s (%s; %s in room)',
        sock.user.name, sock.id, sock.user.roomId, reason, room.length
      )

      // any players left in room?
      if (room.length && !Object.keys(room.sockets).some(id => !!io.sockets.sockets[id]._lastPlayerStatus)) {
        io.to(sock.user.roomId).emit('action', {
          type: PLAYER_LEAVE,
        })

        log('No more Players are present in room %s', sock.user.roomId)
      }
    })

    // attach action handler
    sock.on('action', async (action, acknowledge) => {
      const { type } = action

      if (!sock.user) {
        return acknowledge({
          type: SOCKET_AUTH_ERROR,
        })
      }

      if (typeof handlers[type] !== 'function') {
        log('No handler for socket action type: %s', type)
        return
      }

      try {
        await handlers[type](sock, action, acknowledge)
      } catch (err) {
        log(err)

        return acknowledge({
          type: type + _ERROR,
          error: `Error in ${type}: ${err.message}`,
        })
      }
    })

    // it's possible for an admin to not be in a room
    if (typeof sock.user.roomId !== 'number') return

    // add user to room
    sock.join(sock.user.roomId)

    const room = sock.adapter.rooms[sock.user.roomId]

    // if there's a player in room, emit its last known status
    const lastStatusSocket = Object.keys(room.sockets).find(id => !!io.sockets.sockets[id]._lastPlayerStatus)

    if (lastStatusSocket) {
      io.to(sock.id).emit('action', {
        type: PLAYER_STATUS,
        payload: io.sockets.sockets[lastStatusSocket]._lastPlayerStatus,
      })
    }

    log('%s (%s) joined room %s (%s in room)',
      sock.user.name, sock.id, sock.user.roomId, room.length
    )

    // send library and room's queue
    try {
      io.to(sock.id).emit('action', {
        type: QUEUE_PUSH,
        payload: await Queue.getQueue(sock.user.roomId),
      })

      io.to(sock.id).emit('action', {
        type: LIBRARY_PUSH,
        payload: await Library.get(),
      })
    } catch (err) {
      log(err)
    }
  })
}
