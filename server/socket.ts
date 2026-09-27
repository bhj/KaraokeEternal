import getLogger from './lib/Log.js'
import jsonWebToken from 'jsonwebtoken'
import parseCookie from './lib/parseCookie.js'
import Library from './Library/Library.js'
import LibrarySocket from './Library/socket.js'
import MediaSocket from './Media/socket.js'
import PlayerSocket from './Player/socket.js'
import Prefs from './Prefs/Prefs.js'
import PrefsSocket from './Prefs/socket.js'
import Rooms from './Rooms/Rooms.js'
import RoomsSocket from './Rooms/socket.js'
import Queue from './Queue/Queue.js'
import QueueSocket from './Queue/socket.js'

import {
  LIBRARY_PUSH,
  QUEUE_PUSH,
  STARS_PUSH,
  STAR_COUNTS_PUSH,
  PLAYER_STATUS,
  PLAYER_LEAVE,
  PREFS_PUSH,
  SOCKET_AUTH_ERROR,
  _ERROR,
} from '../shared/actionTypes.js'
const log = getLogger('server')

const handlers = {
  ...LibrarySocket,
  ...MediaSocket,
  ...QueueSocket,
  ...PlayerSocket,
  ...PrefsSocket,
  ...RoomsSocket,
}

const { verify: jwtVerify } = jsonWebToken

export default function (io, jwtKey, getClientIp) {
  io.on('connection', (sock) => {
    const clientIp = getClientIp(sock)
    const { keToken } = parseCookie(sock.handshake.headers.cookie)
    const clientLibraryVersion = parseInt(sock.handshake.query.library, 10)
    const clientStarsVersion = parseInt(sock.handshake.query.stars, 10)

    // authenticate the JWT sent via cookie in http handshake
    try {
      const decoded = jwtVerify(keToken, jwtKey) as { exp?: number }
      // Reject tokens without an expiry (e.g. issued before JWT expiry existed).
      if (typeof decoded.exp !== 'number') throw new Error('token missing exp')
      sock.user = decoded

      // success
      log.verbose('%s (%s) connected from %s', sock.user.name, sock.id, clientIp)
    } catch (err) {
      io.to(sock.id).emit('action', {
        type: SOCKET_AUTH_ERROR,
      })

      sock.user = null
      sock.disconnect()
      log.verbose('disconnected %s (%s)', clientIp, err.message)
      return
    }

    // attach disconnect handler
    sock.on('disconnect', (reason) => {
      log.verbose('%s (%s) disconnected (%s)',
        sock.user.name, sock.id, reason,
      )

      if (typeof sock.user.roomId !== 'number') return

      // beyond this point assumes there is a room

      log.verbose('%s (%s) left room %s (%s; %s in room)',
        sock.user.name, sock.id, sock.user.roomId, reason,
        sock.adapter.rooms.get(Rooms.prefix(sock.user.roomId))?.size ?? 0,
      )

      // any players left in room?
      if (!Rooms.isPlayerPresent(io, sock.user.roomId)) {
        io.to(Rooms.prefix(sock.user.roomId)).emit('action', {
          type: PLAYER_LEAVE,
          payload: { socketId: sock.id },
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

    // a throw below would escape socket.io's connect path and crash the
    // process via uncaughtException, so one bad payload (e.g. a corrupted
    // room queue) must not go unhandled
    try {
      // push prefs (admin only)
      if (sock.user.isAdmin) {
        log.verbose('pushing prefs to %s (%s)', sock.user.name, sock.id)
        io.to(sock.id).emit('action', {
          type: PREFS_PUSH,
          payload: Prefs.get(),
        })
      }

      // push library (only if client's is outdated)
      if (clientLibraryVersion !== Library.cache.version) {
        log.verbose('pushing library to %s (%s) (client=%s, server=%s)',
          sock.user.name, sock.id, clientLibraryVersion, Library.cache.version)

        io.to(sock.id).emit('action', {
          type: LIBRARY_PUSH,
          payload: Library.get(),
        })
      }

      // push user's stars
      io.to(sock.id).emit('action', {
        type: STARS_PUSH,
        payload: Library.getUserStars(sock.user.userId),
      })

      // push star counts (only if client's is outdated)
      if (clientStarsVersion !== Library.starCountsCache.version) {
        log.verbose('pushing star counts to %s (%s) (client=%s, server=%s)',
          sock.user.name, sock.id, clientStarsVersion, Library.starCountsCache.version)

        io.to(sock.id).emit('action', {
          type: STAR_COUNTS_PUSH,
          payload: Library.getStarCounts(),
        })
      }

      // it's possible for an admin to not be in a room
      if (typeof sock.user.roomId !== 'number') return

      // beyond this point assumes there is a room

      // add user to room and track membership
      sock.join(Rooms.prefix(sock.user.roomId))
      Rooms.trackUser(sock.user.roomId, sock.user.userId)

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
        sock.user.name, sock.id, sock.user.roomId,
        sock.adapter.rooms.get(Rooms.prefix(sock.user.roomId))?.size ?? 0,
      )

      // send room's queue
      io.to(sock.id).emit('action', {
        type: QUEUE_PUSH,
        payload: Queue.get(sock.user.roomId),
      })
    } catch (err) {
      log.error('error pushing initial state to %s (%s): %s',
        sock.user.name, sock.id, err?.stack || err)
    }
  })
}
