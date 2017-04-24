const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:player')

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
  PLAYER_QUEUE_END,
  EMIT_PLAYER_ERROR,
  PLAYER_ERROR,
  EMIT_PLAYER_LEAVE,
  PLAYER_LEAVE,
} = require('../constants')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_PLAYER_NEXT]: async (ctx, { payload }) => {
    // get next-highest queue item id
    let item

    try {
      const q = squel.select()
        .from('queue')
        .join('songs USING(songId)')
        .where('roomId = ?', ctx.user.roomId)
        .where('queueId > ?', payload)
        .limit(1)

      const { text, values } = q.toParam()
      item = await db.get(text, values)
    } catch (err) {
      log(err.message)
      return Promise.reject(err)
    }

    if (!item) {
      // we're already on the last queued item
      ctx.io.to(ctx.user.roomId).emit('action', {
        type: PLAYER_QUEUE_END,
        payload: null
      })
      return
    }

    // emits to room, but only player should be listening
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_NEXT,
      payload: item.queueId
    })
  },
  [REQUEST_PLAYER_PLAY]: async (ctx, { payload }) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PLAY,
    })
  },
  [REQUEST_PLAYER_PAUSE]: async (ctx, { payload }) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PAUSE,
    })
  },
  [REQUEST_PLAYER_VOLUME]: async (ctx, { payload }) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_VOLUME,
      payload
    })
  },
  [EMIT_PLAYER_STATUS]: async (ctx, { payload }) => {
    // flag this socket id as a player so
    // we can tell the room if/when it leaves
    ctx.socket.socket._isPlayer = true

    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_STATUS,
      payload,
    })
  },
  [EMIT_PLAYER_ERROR]: async (ctx, { payload }) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_ERROR,
      payload,
    })
  },
  [EMIT_PLAYER_LEAVE]: async (ctx, { payload }) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_LEAVE,
      payload: {
        socketId: ctx.socket.socket.id,
      }
    })
  },
}

module.exports = {
  ACTION_HANDLERS,
}
