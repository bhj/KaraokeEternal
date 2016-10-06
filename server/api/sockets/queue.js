const QUEUE_CHANGE = 'queue/QUEUE_CHANGE'
const QUEUE_END = 'queue/QUEUE_END'
const QUEUE_ERROR = 'queue/QUEUE_ERROR'

// client actions
const QUEUE_ADD = 'server/QUEUE_ADD'
const QUEUE_REMOVE = 'server/QUEUE_REMOVE'


// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    let song, res

    if (!await _roomIsOpen(ctx, ctx.user.roomId)) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Room is no longer open'}
      })
      return
    }

    // verify song exists
    song = await ctx.db.get('SELECT * FROM songs WHERE songId = ?', payload)

    if (!song) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Song not found'}
      })
      return
    }

    // insert row
    res = await ctx.db.run('INSERT INTO queue (roomId, songId, userId) VALUES (?, ?, ?)',
       ctx.user.roomId, payload, ctx.user.userId)

    if (res.changes !== 1) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Error adding song (db changes !== 1)'}
      })
    }

    // success! tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx, ctx.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    let item, res

    if (!await _roomIsOpen(ctx, ctx.user.roomId)) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Room is no longer open'}
      })
      return
    }

    // verify item exists
    item = await ctx.db.get('SELECT * FROM queue WHERE queueId = ?', payload)

    if (!item) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Item not found'}
      })
      return
    }

    // is it in the user's room?
    if (item.roomId !== ctx.user.roomId) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Item is not in your room'}
      })
      return
    }

    // is it the user's item?
    if (item.userId !== ctx.user.userId) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Item is NOT YOURS'}
      })
      return
    }

    // delete item
    res = await ctx.db.run('DELETE FROM queue WHERE queueId = ?', payload)

    if (res.changes !== 1) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Could not delete item (db error)'}
      })
      return
    }

    // success! tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx, ctx.user.roomId)
    })
  },
}

async function getQueue(ctx, roomId) {
  let result = []
  let entities = {}

  let rows = await ctx.db.all('SELECT queue.*, songs.provider, users.name AS userName FROM queue JOIN songs USING(songId) LEFT OUTER JOIN users USING(userId) WHERE roomId = ? ORDER BY queueId', roomId)

  rows.forEach(function(row){
    result.push(row.queueId)
    entities[row.queueId] = row
  })

  return {result, entities}
}

async function _roomIsOpen(ctx, roomId) {
  const room = await ctx.db.get('SELECT * FROM rooms WHERE roomId = ?', roomId)
  return (room || room.status === 'open')
}

module.exports = {
  ACTION_HANDLERS,
  getQueue,
  QUEUE_CHANGE,
}
