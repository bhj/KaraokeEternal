const Queue = require('../Queue')

const {
  PLAYER_BG_ALPHA,
  PLAYER_BG_ALPHA_REQUEST,
  PLAYER_NEXT,
  PLAYER_NEXT_REQUEST,
  PLAYER_PLAY,
  PLAYER_PLAY_REQUEST,
  PLAYER_PAUSE,
  PLAYER_PAUSE_REQUEST,
  PLAYER_VISUALIZER,
  PLAYER_VISUALIZER_REQUEST,
  PLAYER_VISUALIZER_PRESET,
  PLAYER_VISUALIZER_PRESET_REQUEST,
  PLAYER_VOLUME,
  PLAYER_VOLUME_REQUEST,
  PLAYER_STATUS,
  PLAYER_STATUS_REQUEST,
  PLAYER_ERROR,
  PLAYER_ERROR_REQUEST,
  PLAYER_LEAVE_REQUEST,
  PLAYER_LEAVE,
} = require('../../shared/actionTypes')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_BG_ALPHA_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_BG_ALPHA,
      payload
    })
  },
  [PLAYER_NEXT_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_NEXT,
      payload: await Queue.getQueue(sock.user.roomId),
    })
  },
  [PLAYER_PLAY_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_PLAY,
    })
  },
  [PLAYER_PAUSE_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_PAUSE,
    })
  },
  [PLAYER_VISUALIZER_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_VISUALIZER,
      payload
    })
  },
  [PLAYER_VISUALIZER_PRESET_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_VISUALIZER_PRESET,
      payload,
    })
  },
  [PLAYER_VOLUME_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_VOLUME,
      payload
    })
  },
  [PLAYER_STATUS_REQUEST]: async (sock, { payload }) => {
    // so we can tell the room when players leave and
    // relay last known player status on client join
    sock._lastPlayerStatus = payload

    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_STATUS,
      payload,
    })
  },
  [PLAYER_LEAVE_REQUEST]: async (sock, { payload }) => {
    sock._lastPlayerStatus = null

    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_LEAVE,
      payload: {
        socketId: sock.id,
      }
    })
  },
  [PLAYER_ERROR_REQUEST]: async (sock, { payload }) => {
    sock.server.to(sock.user.roomId).emit('action', {
      type: PLAYER_ERROR,
      payload,
    })
  },
}

module.exports = ACTION_HANDLERS
