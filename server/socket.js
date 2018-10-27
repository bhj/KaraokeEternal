const log = require('./lib/logger')(`server[${process.pid}]`)
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
  STARS_PUSH,
  PLAYER_STATUS,
  PLAYER_LEAVE,
  SOCKET_AUTH_ERROR,
  _ERROR,
} = require('../shared/actions')

const handlers = {
  ...LibrarySocket,
  ...QueueSocket,
  ...PlayerSocket,
}

module.exports = function (io, jwtKey) {
  io.on('connection', async (sock) => {
    const { kfToken } = parseCookie(sock.handshake.headers.cookie)
    const clientLibraryVersion = parseInt(sock.handshake.query.v, 10)

    // decode JWT in cookie sent with socket handshake
    try {
      sock.user = jwtVerify(kfToken, jwtKey)
    } catch (err) {
      io.to(sock.id).emit('action', {
        type: SOCKET_AUTH_ERROR,
      })

      sock.user = null
      sock.disconnect()
      log.info('disconnected %s (%s)', sock.handshake.address, err.message)
      return
    }

    log.verbose('%s (%s) connected from %s',
      sock.user.name, sock.id, sock.handshake.address
    )

    // attach disconnect handler
    sock.on('disconnect', reason => {
      log.verbose('%s (%s) disconnected (%s)',
        sock.user.name, sock.id, reason
      )

      // beyond this point assumes there is a room
      if (typeof sock.user.roomId === 'undefined') {
        return
      }

      const room = sock.adapter.rooms[sock.user.roomId] || []

      log.info('%s (%s) left room %s (%s; %s in room)',
        sock.user.name, sock.id, sock.user.roomId, reason, room.length
      )

      // any players left in room?
      if (room.length && !Object
        .keys(room.sockets)
        .some(id => io.sockets.sockets[id] && !!io.sockets.sockets[id]._lastPlayerStatus)) {
        io.to(sock.user.roomId).emit('action', {
          type: PLAYER_LEAVE,
        })
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
        log.error('No handler for socket action: %s', type)
        return
      }

      try {
        await handlers[type](sock, action, acknowledge)
      } catch (err) {
        log.error(err)

        return acknowledge({
          type: type + _ERROR,
          error: `Error in ${type}: ${err.message}`,
        })
      }
    })

    try {
      // only push library if client's is outdated
      if (clientLibraryVersion < Library.getVersion()) {
        log.verbose('pushing library to %s (%s) (client=%s, server=%s)',
          sock.user.name, sock.id, clientLibraryVersion, Library.getVersion())

        io.to(sock.id).emit('action', {
          type: LIBRARY_PUSH,
          payload: await Library.get(),
        })
      }

      // push stars
      io.to(sock.id).emit('action', {
        type: STARS_PUSH,
        payload: await Library.getStars(sock.user.userId),
      })
    } catch (err) {
      log.error(err)
    }

    // it's possible for an admin to not be in a room
    if (typeof sock.user.roomId !== 'number') return

    // beyond this point assumes there is a room

    // add user to room
    sock.join(sock.user.roomId)

    const room = sock.adapter.rooms[sock.user.roomId]

    // if there's a player in room, emit its last known status
    const lastStatusSocket = Object.keys(room.sockets)
      .find(id => !!io.sockets.sockets[id]._lastPlayerStatus)

    if (lastStatusSocket) {
      io.to(sock.id).emit('action', {
        type: PLAYER_STATUS,
        payload: io.sockets.sockets[lastStatusSocket]._lastPlayerStatus,
      })
    }

    log.info('%s (%s) joined room %s (%s in room)',
      sock.user.name, sock.id, sock.user.roomId, room.length
    )

    // send room's queue
    try {
      io.to(sock.id).emit('action', {
        type: QUEUE_PUSH,
        payload: await Queue.getQueue(sock.user.roomId),
      })
    } catch (err) {
      log.error(err)
    }
  })
}
