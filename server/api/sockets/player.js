const PLAYER_PLAY_REQUEST = 'server/PLAYER_PLAY'
const PLAYER_PLAY = 'player/PLAYER_PLAY'

const PLAYER_PAUSE_REQUEST = 'server/PLAYER_PAUSE'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'

const PLAYER_VOLUME_REQUEST = 'server/PLAYER_VOLUME'
const PLAYER_VOLUME = 'player/PLAYER_VOLUME'

const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
const PLAYER_NEXT = 'player/PLAYER_NEXT'

const PLAYER_EMIT_STATUS = 'server/PLAYER_EMIT_STATUS'
const PLAYER_STATUS = 'player/PLAYER_STATUS'

const PLAYER_EMIT_MEDIA_ERROR = 'server/PLAYER_EMIT_MEDIA_ERROR'
const PLAYER_MEDIA_ERROR = 'player/PLAYER_MEDIA_ERROR'

const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_NEXT_REQUEST]: async (ctx, {payload}) => {
    // get next-highest queue item id
    // @todo try/catch
    let item = await ctx.db.get('SELECT * FROM queue WHERE roomId = ? AND queueId > ? LIMIT 1', ctx.user.roomId, payload)

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
  // Broadcast player's status to room
  [PLAYER_EMIT_STATUS]: async (ctx, {payload}) => {
    // to everyone in room except broadcasting player
    ctx.socket.socket.broadcast.to(ctx.user.roomId).emit('action', {
      type: PLAYER_STATUS,
      payload
    })
  },
  [PLAYER_EMIT_MEDIA_ERROR]: async (ctx, {payload}) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_MEDIA_ERROR,
      payload
    })
  },
  [PLAYER_PLAY_REQUEST]: async (ctx, {payload}) => {
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: PLAYER_PLAY,
      payload: null
    })
  },
  [PLAYER_PAUSE_REQUEST]: async (ctx, {payload}) => {
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
}

module.exports = {
  ACTION_HANDLERS,
}
