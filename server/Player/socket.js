const Queue = require('../Queue')

const {
  REQUEST_PLAYER_NEXT,
  PLAYER_NEXT,
  REQUEST_PLAYER_PLAY,
  PLAYER_PLAY,
  REQUEST_PLAYER_PAUSE,
  PLAYER_PAUSE,
  REQUEST_PLAYER_VOLUME,
  PLAYER_VOLUME,
  EMIT_PLAYER_STATUS,
  PLAYER_STATUS,
  EMIT_PLAYER_ERROR,
  PLAYER_ERROR,
  EMIT_PLAYER_LEAVE,
  PLAYER_LEAVE,
} = require('../../shared/actions')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_PLAYER_NEXT]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_NEXT,
      payload: await Queue.getQueue(sock.user.roomId),
    })
  },
  [REQUEST_PLAYER_PLAY]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_PLAY,
    })
  },
  [REQUEST_PLAYER_PAUSE]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_PAUSE,
    })
  },
  [REQUEST_PLAYER_VOLUME]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_VOLUME,
      payload
    })
  },
  [EMIT_PLAYER_STATUS]: async (sock, { payload }) => {
    // so we can tell the room when players leave and
    // relay last known player status on client join
    sock._lastPlayerStatus = payload

    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_STATUS,
      payload,
    })
  },
  [EMIT_PLAYER_LEAVE]: async (sock, { payload }) => {
    sock._lastPlayerStatus = null

    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_LEAVE,
      payload: {
        socketId: sock.id,
      }
    })
  },
  [EMIT_PLAYER_ERROR]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_ERROR,
      payload,
    })
  },
}

module.exports = ACTION_HANDLERS
