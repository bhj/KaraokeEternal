const log = require('./lib/logger')(`server[${process.pid}]`)
const jwtVerify = require('jsonwebtoken').verify

const Library = require('./Library')
const LibrarySocket = require('./Library/socket')
const PlayerSocket = require('./Player/socket')
const Prefs = require('./Prefs')
const PrefsSocket = require('./Prefs/socket')
const Rooms = require('./Rooms')
const Queue = require('./Queue')
const QueueSocket = require('./Queue/socket')
const parseCookie = require('./lib/parseCookie')
const {
  LIBRARY_PUSH,
  QUEUE_PUSH,
  STARS_PUSH,
  STAR_COUNTS_PUSH,
  PLAYER_STATUS,
  PLAYER_LEAVE,
  PREFS_PUSH,
  SOCKET_AUTH_ERROR,
  _ERROR,
} = require('../shared/actionTypes')

const handlers = {
  ...LibrarySocket,
  ...QueueSocket,
  ...PlayerSocket,
  ...PrefsSocket,
}

module.exports = function (io, jwtKey) {
  io.on('connection', async (sock) => {
    const { kfToken } = parseCookie(sock.handshake.headers.cookie)
    const clientLibraryVersion = parseInt(sock.handshake.query.library, 10)
    const clientStarsVersion = parseInt(sock.handshake.query.stars, 10)

    // authenticate the JWT sent via cookie in http handshake
    try {
      sock.user = jwtVerify(kfToken, jwtKey)
      log.verbose('%s (%s) connected from %s', sock.user.name, sock.id, sock.handshake.address)
    } catch (err) {
      io.to(sock.id).emit('action', {
        type: SOCKET_AUTH_ERROR,
      })

      sock.user = null
      sock.disconnect()
      log.verbose('disconnected %s (%s)', sock.handshake.address, err.message)
      return
    }

    // attach disconnect handler
    sock.on('disconnect', reason => {
      log.verbose('%s (%s) disconnected (%s)',
        sock.user.name, sock.id, reason
      )

      // beyond this point assumes there is a room
      if (typeof sock.user.roomId !== 'number') {
        return
      }

      const room = sock.adapter.rooms[Rooms.prefix(sock.user.roomId)] || []

      log.verbose('%s (%s) left room %s (%s; %s in room)',
        sock.user.name, sock.id, sock.user.roomId, reason, room.length
      )

      // any players left in room?
      if (room.length && !Object
        .keys(room.sockets)
        .some(id => io.sockets.sockets[id] && !!io.sockets.sockets[id]._lastPlayerStatus)) {
        io.to(Rooms.prefix(sock.user.roomId)).emit('action', {
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

    // push prefs (admin only)
    if (sock.user.isAdmin) {
      log.verbose('pushing prefs to %s (%s)', sock.user.name, sock.id)
      io.to(sock.id).emit('action', {
        type: PREFS_PUSH,
        payload: await Prefs.get(),
      })
    }

    // push library (only if client's is outdated)
    if (clientLibraryVersion !== Library.getLibraryVersion()) {
      log.verbose('pushing library to %s (%s) (client=%s, server=%s)',
        sock.user.name, sock.id, clientLibraryVersion, Library.getLibraryVersion())

      io.to(sock.id).emit('action', {
        type: LIBRARY_PUSH,
        payload: await Library.get(),
      })
    }

    // push user's stars
    io.to(sock.id).emit('action', {
      type: STARS_PUSH,
      payload: await Library.getStars(sock.user.userId),
    })

    // push star counts (only if client's is outdated)
    if (clientStarsVersion !== Library.getStarCountsVersion()) {
      log.verbose('pushing star counts to %s (%s) (client=%s, server=%s)',
        sock.user.name, sock.id, clientStarsVersion, Library.getStarCountsVersion())

      io.to(sock.id).emit('action', {
        type: STAR_COUNTS_PUSH,
        payload: await Library.getStarCounts(),
      })
    }

    // it's possible for an admin to not be in a room
    if (typeof sock.user.roomId !== 'number') return

    // beyond this point assumes there is a room

    // add user to room
    sock.join(Rooms.prefix(sock.user.roomId))
    const room = sock.adapter.rooms[Rooms.prefix(sock.user.roomId)]

    // if there's a player in room, emit its last known status
    const lastStatusSocket = Object.keys(room.sockets)
      .find(id => !!io.sockets.sockets[id] && !!io.sockets.sockets[id]._lastPlayerStatus)

    if (lastStatusSocket) {
      io.to(sock.id).emit('action', {
        type: PLAYER_STATUS,
        payload: io.sockets.sockets[lastStatusSocket]._lastPlayerStatus,
      })
    }

    log.verbose('%s (%s) joined room %s (%s in room)',
      sock.user.name, sock.id, sock.user.roomId, room.length
    )

    // send room's queue
    io.to(sock.id).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId),
    })
  })
}
