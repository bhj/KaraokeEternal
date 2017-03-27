const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:player')

const {
  PLAYER_NEXT_REQUEST,
  PLAYER_NEXT,
  PLAYER_QUEUE_END,
  PLAYER_PLAY_REQUEST,
  PLAYER_PLAY,
  PLAYER_PAUSE_REQUEST,
  PLAYER_PAUSE,
  PLAYER_VOLUME_REQUEST,
  PLAYER_VOLUME,
  EMIT_STATUS,
  EMIT_ERROR,
  PLAYBACK_STATUS,
  PLAYBACK_ERROR,
  _SUCCESS,
  _ERROR,
} = require('../constants')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_NEXT_REQUEST]: async (ctx, {payload}) => {
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
    } catch(err) {
      log(err.message)
      return Promise.reject(err)
    }

    // ack (@todo: wait until player response)
    ctx.acknowledge({
      type: PLAYER_NEXT_REQUEST+_SUCCESS,
    })

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
  [PLAYER_PLAY_REQUEST]: async (ctx, {payload}) => {
    // ack (@todo: wait until player response)
    ctx.acknowledge({
      type: PLAYER_PLAY_REQUEST+_SUCCESS,
    })

    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PLAY,
      payload: null
    })
  },
  [PLAYER_PAUSE_REQUEST]: async (ctx, {payload}) => {
    // ack (@todo: wait until player response)
    ctx.acknowledge({
      type: PLAYER_PAUSE_REQUEST+_SUCCESS,
    })

    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PAUSE,
      payload: null
    })
  },
  [PLAYER_VOLUME_REQUEST]: async (ctx, {payload}) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_VOLUME,
      payload
    })
  },
  [EMIT_STATUS]: async (ctx, {payload}) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYBACK_STATUS,
      payload
    })
  },
  [EMIT_ERROR]: async (ctx, {payload}) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYBACK_ERROR,
      payload
    })
  },
}

module.exports = {
  ACTION_HANDLERS,
}
