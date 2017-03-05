const db = require('sqlite')
const squel = require('squel')

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

    // is room open?
    let room
    try {
      const q = squel.select()
        .from('rooms')
        .where('roomId = ?', ctx.user.roomId)

      const { text, values } = q.toParam()
      room = await db.get(text, values)
    } catch(err) {
      return Promise.reject(err)
    }

    if (!room || room.status !== 'open') {
      // callback with truthy error msg
      ctx.acknowledge('Room is no longer open')
      return
    }

    // verify song exists
    let song
    try {
      const q = squel.select()
        .from('songs')
        .where('songId = ?', payload)

      const { text, values } = q.toParam()
      song = await db.get(text, values)
    } catch(err) {
      // callback with truthy error msg
      ctx.acknowledge(err.message)
      return Promise.reject(err)
    }

    if (!song) {
      // callback with truthy error msg
      ctx.acknowledge('Song not found')
      return
    }

    // insert row
    try {
      const q = squel.insert()
        .into('queue')
        .set('roomId', ctx.user.roomId)
        .set('songId', payload)
        .set('userId', ctx.user.userId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.changes !== 1) {
        throw new Error('Could not add song to queue')
      }
    } catch(err) {
      // callback with truthy error msg
      ctx.acknowledge(err.message)
      return Promise.reject(err)
    }

    // success!
    ctx.acknowledge()

    // tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    const queueId = payload
    let item, nextItem

    if (!await _roomIsOpen(ctx, ctx.user.roomId)) {
      // callback with truthy error msg
      ctx.acknowledge('Room is no longer open')
      return
    }

    // verify item exists
    try {
      const q = squel.select()
        .from('queue')
        .where('queueId = ?', queueId)

      const { text, values } = q.toParam()
      item = await db.get(text, values)
    } catch(err) {
      // callback with truthy error msg
      ctx.acknowledge(err.message)
      return Promise.reject(err)
    }

    if (!item) {
      // callback with truthy error msg
      ctx.acknowledge('Queue item not found')
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
    try {
      const q = squel.delete()
        .from('queue')
        .where('queueId = ?', queueId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.changes !== 1) {
        throw new Error('Could not remove queue item')
      }
    } catch(err) {
      ctx.acknowledge(err.message)
      return Promise.reject(err)
    }

    // does user have another item we could try to replace it with?
    try {
      const q = squel.select()
        .field('queueId')
        .from('queue')
        .where('queueId > ?', queueId)
        .where('userId = ?', item.userId)
        .limit(1)

      const { text, values } = q.toParam()
      nextItem = await db.get(text, values)
    } catch(err) {
      // callback with truthy error msg
      ctx.acknowledge(err.message)
      return Promise.reject(err)
    }

    if (nextItem) {
      try {
        const q = squel.update()
          .table('queue')
          .set('queueId = ?', queueId)
          .where('queueId = ?', nextItem.queueId)

        const { text, values } = q.toParam()
        const res = await db.run(text, values)

        if (res.changes !== 1) {
          throw new Error('Could not update queue item id')
        }
      } catch(err) {
        // well, we tryed...
      }
    }

    // success!
    ctx.acknowledge()

    // tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_CHANGE,
      payload: await getQueue(ctx.user.roomId)
    })
  },
}

async function getQueue(roomId) {
  let result = []
  let entities = {}
  let rows

  try {
    const q = squel.select()
      .from('queue')
      .field('queueId')
      .field('songId')
      .field('userId')
      .field('songs.duration')
      .field('users.name')
      .join('songs USING(songId)')
      .join('users USING(userId)')
      .where('roomId = ?', roomId)
      .order('queueId')

    const { text, values } = q.toParam()
    rows = await db.all(text, values)
  } catch(err) {
    return Promise.reject(err)
  }

  rows.forEach(function(row){
    result.push(row.queueId)
    entities[row.queueId] = row
  })

  return { result, entities }
}

module.exports = {
  ACTION_HANDLERS,
  getQueue,
  QUEUE_CHANGE,
}
