const log = require('debug')(`app:server [${process.pid}]`)
const jwtVerify = require('jsonwebtoken').verify

const User = require('./User/socket')
const Queue = require('./Queue/socket')
const Player = require('./Player/socket')
const Media = require('./Media')
const getQueue = require('./Queue/getQueue')
const parseCookie = require('./lib/parseCookie')

const {
  LIBRARY_UPDATE,
  QUEUE_UPDATE,
  PLAYER_ENTER,
  PLAYER_LEAVE,
  SOCKET_AUTH_ERROR,
  _ERROR,
} = require('../constants/actions')

const handlers = {
  ...User,
  ...Queue,
  ...Player,
}

module.exports = function (io) {
  io.on('connection', async (sock) => {
    const { id_token } = parseCookie(sock.handshake.headers.cookie)

    // authenticate using cookie from socket handshake
    try {
      sock.user = jwtVerify(id_token, 'shared-secret')
    } catch (err) {
      io.to(sock.id).emit('action', {
        type: SOCKET_AUTH_ERROR,
        meta: {
          error: `${err.message} (try signing in again)`
        }
      })

      sock.user = null
      sock.disconnect()
      return
    }

    // add user to the room on their jwt
    sock.join(sock.user.roomId)

    const room = sock.adapter.rooms[sock.user.roomId]

    log('%s (%s) joined room %s (%s in room)',
      sock.user.name, sock.id, sock.user.roomId, room.length
    )

    // send queue
    try {
      io.to(sock.id).emit('action', {
        type: QUEUE_UPDATE,
        payload: await getQueue(sock.user.roomId),
      })
    } catch (err) {
      log(err)
    }

    // send library
    try {
      io.to(sock.id).emit('action', {
        type: LIBRARY_UPDATE,
        payload: await Media.getLibrary(),
      })
    } catch (err) {
      log(err)
    }

    // player in room?
    const hasPlayer = Object.keys(room.sockets).some(id => {
      return io.sockets.sockets[id]._isPlayer === true
    })

    if (hasPlayer) {
      io.to(sock.user.roomId).emit('action', {
        type: PLAYER_ENTER,
      })
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

      if (sock._isPlayer && room.length) {
        // any other players left in room?
        const hasPlayer = Object.keys(room.sockets).some(id => {
          return io.sockets.sockets[id]._isPlayer === true
        })

        if (!hasPlayer) {
          io.to(sock.user.roomId).emit('action', {
            type: PLAYER_LEAVE,
          })
        }
      }
    })

    // attach action handler
    sock.on('action', async (action, acknowledge) => {
      const { type } = action
      let called = false

      if (!sock.user) {
        return acknowledge({
          type: SOCKET_AUTH_ERROR,
          meta: {
            error: 'Invalid token (try signing in again)'
          }
        })
      }

      if (typeof handlers[type] === 'function') {
        called = true

        try {
          await handlers[type](sock, action, acknowledge)
        } catch (err) {
          log(err)
          const error = `Error in handler ${type}: ${err.message}`

          return acknowledge({
            type: type + _ERROR,
            meta: {
              error,
            }
          })
        }
      }

      if (!called) {
        log('warning: no handler for action type: %s', type)
      }
    })
  })
}
