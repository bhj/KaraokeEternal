const db = require('sqlite')

const QUEUE_CHANGE = 'queue/QUEUE_CHANGE'
const QUEUE_END = 'queue/QUEUE_END'

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
      // callback with truthy error msg
      ctx.acknowledge('Room is no longer open')
      return
    }

    // verify song exists
    song = await db.get('SELECT * FROM songs WHERE songId = ?', payload)

    if (!song) {
      // callback with truthy error msg
      ctx.acknowledge('Song not found')
      return
    }

    // insert row
    res = await db.run('INSERT INTO queue (roomId, songId, userId) VALUES (?, ?, ?)',
       ctx.user.roomId, payload, ctx.user.userId)

    if (res.changes !== 1) {
      // callback with truthy error msg
      ctx.acknowledge('Could not add song to queue')
      return
    }

    // success!
    ctx.acknowledge()

    // tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx, ctx.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    const queueId = payload
    let item, nextItem, res

    if (!await _roomIsOpen(ctx, ctx.user.roomId)) {
      // callback with truthy error msg
      ctx.acknowledge('Room is no longer open')
      return
    }

    // verify item exists
    item = await db.get('SELECT * FROM queue WHERE queueId = ?', queueId)

    if (!item) {
      // callback with truthy error msg
      ctx.acknowledge('Item not found')
      return
    }

    // is it in the user's room?
    if (item.roomId !== ctx.user.roomId) {
      // callback with truthy error msg
      ctx.acknowledge('Item is not in your room')
      return
    }

    // is it the user's item?
    if (item.userId !== ctx.user.userId) {
      // callback with truthy error msg
      ctx.acknowledge('Item is NOT YOURS')
      return
    }

    // delete item
    res = await db.run('DELETE FROM queue WHERE queueId = ?', queueId)

    if (res.changes !== 1) {
      // callback with truthy error msg
      ctx.acknowledge('Could not remove queue item')
      return
    }

    // does user have another item we could try to replace it with?
    nextItem = await db.get('SELECT queueId FROM queue WHERE queueId > ? AND userId = ? LIMIT 1', queueId, item.userId)

    if (nextItem) {
      res = await db.run('UPDATE queue SET queueId = ? WHERE queueId = ?', queueId, nextItem.queueId)
    }

    // success!
    ctx.acknowledge()

    // tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx, ctx.user.roomId)
    })
  },
}

async function getQueue(ctx, roomId) {
  let result = []
  let entities = {}

  let rows = await db.all('SELECT queueId, songId, userId, songs.duration, users.name FROM queue JOIN songs USING(songId) JOIN users USING(userId) WHERE roomId = ? ORDER BY queueId', roomId)

  rows.forEach(function(row){
    result.push(row.queueId)
    entities[row.queueId] = row
  })

  return {result, entities}
}

async function _roomIsOpen(ctx, roomId) {
  const room = await db.get('SELECT * FROM rooms WHERE roomId = ?', roomId)
  return (room || room.status === 'open')
}

module.exports = {
  ACTION_HANDLERS,
  getQueue,
  QUEUE_CHANGE,
}
