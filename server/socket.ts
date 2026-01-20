import getLogger from './lib/Log.js'
import jsonWebToken from 'jsonwebtoken'
import parseCookie from './lib/parseCookie.js'
import Library from './Library/Library.js'
import LibrarySocket from './Library/socket.js'
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
  ...QueueSocket,
  ...PlayerSocket,
  ...PrefsSocket,
  ...RoomsSocket,
}

const { verify: jwtVerify } = jsonWebToken

// Track pending room cleanups for grace period
const pendingCleanups = new Map<number, NodeJS.Timeout>()

// Clear all pending cleanups (called on shutdown to prevent SQLITE_MISUSE errors)
export function clearPendingCleanups () {
  for (const timeout of pendingCleanups.values()) {
    clearTimeout(timeout)
  }
  pendingCleanups.clear()
}

export default function (io, jwtKey, validateProxySource: (ip: string) => boolean) {
  io.on('connection', async (sock) => {
    // validate proxy source before doing anything else
    const remoteAddress = sock.handshake.address
    if (!validateProxySource(remoteAddress)) {
      log.verbose('rejected socket connection from untrusted IP: %s', remoteAddress)
      sock.disconnect(true)
      return
    }

    const { keToken } = parseCookie(sock.handshake.headers.cookie)
    const clientLibraryVersion = parseInt(sock.handshake.query.library, 10)
    const clientStarsVersion = parseInt(sock.handshake.query.stars, 10)

    // authenticate the JWT sent via cookie in http handshake
    try {
      sock.user = jwtVerify(keToken, jwtKey)

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
    sock.on('disconnect', async (reason) => {
      log.verbose('%s (%s) disconnected (%s)',
        sock.user.name, sock.id, reason,
      )

      // Log potential socket instability for debugging
      if (reason === 'transport error' || reason === 'transport close') {
        log.warn('Potential socket instability for user %s - reason: %s',
          sock.user.name, reason)
      }

      if (typeof sock.user.roomId !== 'number') return

      // beyond this point assumes there is a room
      const roomId = sock.user.roomId

      log.verbose('%s (%s) left room %s (%s; %s in room)',
        sock.user.name, sock.id, roomId, reason, sock.adapter.rooms.size,
      )

      // any players left in room?
      if (!Rooms.isPlayerPresent(io, roomId)) {
        io.to(Rooms.prefix(roomId)).emit('action', {
          type: PLAYER_LEAVE,
          payload: { socketId: sock.id },
        })
      }

      // Check if this is an ephemeral room that should be cleaned up
      try {
        const isEphemeral = await Rooms.isEphemeral(roomId)
        if (!isEphemeral) return

        // Check if anyone else is still connected to this room
        const roomPrefix = Rooms.prefix(roomId)
        const roomSockets = io.sockets.adapter.rooms.get(roomPrefix)
        const socketsInRoom = roomSockets ? roomSockets.size : 0

        // Cancel any existing pending cleanup for this room
        const existingTimeout = pendingCleanups.get(roomId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
          pendingCleanups.delete(roomId)
        }

        // If no one left in the room, schedule cleanup with grace period
        if (socketsInRoom === 0) {
          log.info('Scheduling cleanup of empty ephemeral room %s (30s grace period)', roomId)

          const timeout = setTimeout(async () => {
            const currentRoomSockets = io.sockets.adapter.rooms.get(roomPrefix)
            if (!currentRoomSockets || currentRoomSockets.size === 0) {
              log.info('Cleaning up empty ephemeral room %s (after grace period)', roomId)
              await Rooms.delete(roomId)
            } else {
              log.verbose('Room %s cleanup cancelled - users reconnected', roomId)
            }
            pendingCleanups.delete(roomId)
          }, 30000) // 30 second grace period

          pendingCleanups.set(roomId, timeout)
        }
      } catch (err) {
        log.error('Error cleaning up ephemeral room: %s', err.message)
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

    // add user to room and track membership
    sock.join(Rooms.prefix(sock.user.roomId))
    Rooms.trackUser(sock.user.roomId, sock.user.userId)

    // Cancel any pending cleanup for this room (user reconnected within grace period)
    const existingCleanup = pendingCleanups.get(sock.user.roomId)
    if (existingCleanup) {
      clearTimeout(existingCleanup)
      pendingCleanups.delete(sock.user.roomId)
      log.verbose('Cancelled pending cleanup for room %s - user reconnected', sock.user.roomId)
    }

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
      sock.user.name, sock.id, sock.user.roomId, sock.adapter.rooms.size,
    )

    // send room's queue
    io.to(sock.id).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId),
    })
  })
}
