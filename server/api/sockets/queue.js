export const QUEUE_UPDATE = 'server/QUEUE_UPDATE'
const QUEUE_ADD = 'server/QUEUE_ADD'
const QUEUE_REMOVE = 'server/QUEUE_REMOVE'
const QUEUE_ERROR = 'server/QUEUE_ERROR'

// const PLAY_NEXT = 'server/PLAY_NEXT' // to server
// const PLAY_NEXT_SUCCESS = 'server/PLAY_NEXT_SUCCESS' // from server

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    const uid = payload
    let song, res

    if (!ctx.user || !ctx.user.roomId) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Invalid token (try signing in again)'}
      })
      return
    }

    if (!await _roomIsOpen(ctx, ctx.user.roomId)) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Room is no longer open'}
      })
      return
    }

    // verify song exists
    song = await ctx.db.get('SELECT * FROM songs WHERE uid = ?', [uid])

    if (!song) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Song not found'}
      })
      return
    }

    // insert row
    res = await ctx.db.run('INSERT INTO queue (roomId, userId, uid, date) VALUES (?, ?, ?, ?)',
      [ctx.user.roomId, ctx.user.id, uid, Date.now()])

    if (res.changes !== 1) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Error adding song (db changes !== 1)'}
      })
    }

    // success! tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_UPDATE,
      payload: await getQueue(ctx, ctx.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    const queueId = payload
    let item, res

    if (!ctx.user || !ctx.user.roomId) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Invalid token (try signing in again)'}
      })
      return
    }

    if (!await _roomIsOpen(ctx, ctx.user.roomId)) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Room is no longer open'}
      })
      return
    }

    // verify item exists
    item = await ctx.db.get('SELECT * FROM queue WHERE queueId = ?', [queueId])

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
    if (item.userId !== ctx.user.id) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Item is NOT YOURS'}
      })
      return
    }

    // delete item
    res = await ctx.db.run('DELETE FROM queue WHERE queueId = ?', [queueId])

    if (res.changes !== 1) {
      ctx.io.to(socketId).emit('action', {
        type: QUEUE_ERROR,
        payload: {message: 'Could not delete item (db changes !== 1)'}
      })
      return
    }

    // success! tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_UPDATE,
      payload: await getQueue(ctx, ctx.user.roomId)
    })
  },
  // [PLAY_NEXT]: async (ctx, {payload}) => {
  //   const { curItemId, roomId } = payload
  //
  //   // get next highest id in the queue
  //   let row =
  //
  //   ctx.io.to(roomId).emit('action', {
  //     type: PLAY_NEXT_SUCCESS,
  //     payload: await fetchQueue(ctx.db, roomId)
  //   })
  // },
}

export default async function queueActions(ctx, next) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  if (handler) await handler(ctx, action)

  // next koa-socket middleware
  await next()
}


export async function getQueue(ctx, roomId) {
  let queueIds = []
  let uids = []
  let items = {}

  // get songs
  let rows = await ctx.db.all('SELECT queue.*, songs.provider, users.name AS userName FROM queue JOIN songs on queue.uid = songs.uid LEFT OUTER JOIN users ON queue.userId = users.id WHERE roomId = ? ORDER BY date', [roomId])

  rows.forEach(function(row){
    queueIds.push(row.queueId)
    items[row.queueId] = row

    // used for quick lookup by Library
    uids.push(row.uid)
  })

  return {result: {uids, queueIds}, entities: items}
}

async function _roomIsOpen(ctx, roomId) {
  const room = await ctx.db.get('SELECT * FROM rooms WHERE id = ?', [roomId])
  return (room || room.status === 'open')
}
