const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:player')

const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
const PLAYER_NEXT = 'player/PLAYER_NEXT'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

const PLAYER_PLAY_REQUEST = 'server/PLAYER_PLAY'
const PLAYER_PLAY = 'player/PLAYER_PLAY'
const PLAYER_PAUSE_REQUEST = 'server/PLAYER_PAUSE'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'
const PLAYER_VOLUME_REQUEST = 'server/PLAYER_VOLUME'
const PLAYER_VOLUME = 'player/PLAYER_VOLUME'

const EMIT_STATUS = 'server/PLAYER_STATUS'
const EMIT_ERROR = 'server/PLAYER_ERROR'
const PLAYBACK_STATUS = 'status/PLAYBACK_STATUS'
const PLAYBACK_ERROR = 'status/PLAYBACK_ERROR'

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
      type: PLAYER_NEXT_REQUEST+'_SUCCESS',
    })

    if (!item) {
      // we're already on the last queued item
      ctx.io.to(ctx.user.roomId).emit('action', {
        type: PLAYER_QUEUE_END,
        payload: null
      })
      return
    }

    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_NEXT,
      payload: item.queueId
    })
  },
  [PLAYER_PLAY_REQUEST]: async (ctx, {payload}) => {
    // ack (@todo: wait until player response)
    ctx.acknowledge({
      type: PLAYER_PLAY_REQUEST+'_SUCCESS',
    })

    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PLAY,
      payload: null
    })
  },
  [PLAYER_PAUSE_REQUEST]: async (ctx, {payload}) => {
    // ack (@todo: wait until player response)
    ctx.acknowledge({
      type: PLAYER_PAUSE_REQUEST+'_SUCCESS',
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
