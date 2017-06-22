const log = require('debug')('app:socket:player')
const getQueue = require('../lib/getQueue')

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
  EMIT_PLAYER_ENTER,
  PLAYER_ENTER,
  EMIT_PLAYER_LEAVE,
  PLAYER_LEAVE,
} = require('../constants')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_PLAYER_NEXT]: async (ctx, { payload }) => {
    // @todo: accept current queueId and pos so server
    // can decide whether to increment song play count
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_NEXT,
      payload: await getQueue(ctx.user.roomId),
    })
  },
  [REQUEST_PLAYER_PLAY]: async (ctx, { payload }) => {
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PLAY,
    })
  },
  [REQUEST_PLAYER_PAUSE]: async (ctx, { payload }) => {
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PAUSE,
    })
  },
  [REQUEST_PLAYER_VOLUME]: async (ctx, { payload }) => {
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_VOLUME,
      payload
    })
  },
  [EMIT_PLAYER_STATUS]: async (ctx, { payload }) => {
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_STATUS,
      payload,
    })
  },
  [EMIT_PLAYER_ERROR]: async (ctx, { payload }) => {
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_ERROR,
      payload,
    })
  },
  [EMIT_PLAYER_ENTER]: async (ctx, { payload }) => {
    // so we can tell the room when player leaves
    ctx.sock._isPlayer = true

    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_ENTER,
      payload: {
        socketId: ctx.socket.socket.id,
      }
    })
  },
  [EMIT_PLAYER_LEAVE]: async (ctx, { payload }) => {
    ctx.sock.server.to(ctx.user.roomId).emit('action', {
      type: PLAYER_LEAVE,
      payload: {
        socketId: ctx.socket.socket.id,
      }
    })
  },
}

module.exports = ACTION_HANDLERS
