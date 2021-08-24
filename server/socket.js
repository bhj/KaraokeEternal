const log = require('./lib/Log').getLogger(`server[${process.pid}]`)
const jwtVerify = require('jsonwebtoken').verify

const parseCookie = require('./lib/parseCookie')
const Library = require('./Library')
const LibrarySocket = require('./Library/socket')
const PlayerSocket = require('./Player/socket')
const Prefs = require('./Prefs')
const PrefsSocket = require('./Prefs/socket')
const Rooms = require('./Rooms')
const Queue = require('./Queue')
const QueueSocket = require('./Queue/socket')
const User = require('./User')
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

      // has account been modified since JWT was generated?
      const user = await User.getById(sock.user.userId)

      if (!user || user.dateUpdated !== sock.user.dateUpdated) {
        throw new Error('account modtime mismatch')
      }

      // success
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

      if (typeof sock.user.roomId !== 'number') return

      // beyond this point assumes there is a room

      log.verbose('%s (%s) left room %s (%s; %s in room)',
        sock.user.name, sock.id, sock.user.roomId, reason, sock.adapter.rooms.size
      )

      // any players left in room?
      for (const s of io.of('/').sockets.values()) {
        if (s.user && s.user.roomId === sock.user.roomId && s._lastPlayerStatus) {
          break
        }

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
        await handlers[type](sock, action, acknowledge, io)
      } catch (err) {
        log.error(err)

        return acknowledge({
          type: type + _ERROR,
          error: `Error in ${type}: ${err.message}`,
        })
      }
    })

    // push prefs (only public prefs if the user is not an admin)
    log.verbose('pushing prefs to %s (%s)', sock.user.name, sock.id)
    io.to(sock.id).emit('action', {
      type: PREFS_PUSH,
      payload: await Prefs.get(!sock.user.isAdmin),
    })

    // push library (only if client's is outdated)
    if (clientLibraryVersion !== Library.cache.version) {
      log.verbose('pushing library to %s (%s) (client=%s, server=%s)',
        sock.user.name, sock.id, clientLibraryVersion, Library.cache.version)

      io.to(sock.id).emit('action', {
        type: LIBRARY_PUSH,
        payload: await Library.get(),
      })
    }

    // push user's stars
    io.to(sock.id).emit('action', {
      type: STARS_PUSH,
      payload: await Library.getUserStars(sock.user.userId),
    })

    // push star counts (only if client's is outdated)
    if (clientStarsVersion !== Library.starCountsCache.version) {
      log.verbose('pushing star counts to %s (%s) (client=%s, server=%s)',
        sock.user.name, sock.id, clientStarsVersion, Library.starCountsCache.version)

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

    // if there's a player in room, emit its last known status
    // @todo this just emits the first status found
    for (const s of io.of('/').sockets.values()) {
      if (s.user && s.user.roomId === sock.user.roomId && s._lastPlayerStatus) {
        io.to(sock.id).emit('action', {
          type: PLAYER_STATUS,
          payload: s._lastPlayerStatus,
        })

        break
      }
    }

    log.verbose('%s (%s) joined room %s (%s in room)',
      sock.user.name, sock.id, sock.user.roomId, sock.adapter.rooms.size
    )

    // send room's queue
    io.to(sock.id).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId),
    })
  })
}
