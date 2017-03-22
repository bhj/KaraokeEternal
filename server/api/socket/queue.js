const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:queue')

const {
  QUEUE_ADD,
  QUEUE_REMOVE,
  QUEUE_UPDATE,
  QUEUE_END,
} = require('../../constants')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id

    // is room open?
    try {
      if (!await _isRoomOpen(ctx.user.roomId)) {
        return ctx.acknowledge({
          type: QUEUE_ADD+'_ERROR',
          meta: {
            error: 'Room is no longer open'
          }
        })
      }
    } catch(err) {
      return Promise.reject(err)
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
      return Promise.reject(err)
    }

    if (!song) {
      return ctx.acknowledge({
        type: QUEUE_ADD+'_ERROR',
        meta: {
          error: 'songId not found: '+payload
        }
      })
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

      if (res.stmt.changes !== 1) {
        throw new Error('Could not add song to queue')
      }
    } catch(err) {
      return Promise.reject(err)
    }

    // success!
    ctx.acknowledge({
      type: QUEUE_ADD+'_SUCCESS',
    })

    // to all in room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_UPDATE,
      payload: await getQueue(ctx.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (ctx, {payload}) => {
    const socketId = ctx.socket.socket.id
    const queueId = payload
    let item, nextItem

    // is room open?
    try {
      if (!await _isRoomOpen(ctx.user.roomId)) {
        return ctx.acknowledge({
          type: QUEUE_REMOVE+'_ERROR',
          meta: {
            error: 'Room is no longer open'
          }
        })
      }
    } catch(err) {
      return Promise.reject(err)
    }

    // verify item exists
    try {
      const q = squel.select()
        .from('queue')
        .where('queueId = ?', queueId)

      const { text, values } = q.toParam()
      item = await db.get(text, values)
    } catch(err) {
      return Promise.reject(err)
    }

    if (!item) {
      return ctx.acknowledge({
        type: QUEUE_REMOVE+'_ERROR',
        meta: {
          error: 'queueId not found: '+queueId
        }
      })
    }

    // is it in the user's room?
    if (item.roomId !== ctx.user.roomId) {
      return ctx.acknowledge({
        type: QUEUE_REMOVE+'_ERROR',
        meta: {
          error: 'queueId is not in your room: '+queueId
        }
      })
    }

    // is it the user's item?
    if (item.userId !== ctx.user.userId) {
      return ctx.acknowledge({
        type: QUEUE_REMOVE+'_ERROR',
        meta: {
          error: 'Item is NOT YOURS: '+queueId
        }
      })
    }

    // delete item
    try {
      const q = squel.delete()
        .from('queue')
        .where('queueId = ?', queueId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        throw new Error('Could not remove queue item')
      }
    } catch(err) {
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

        if (res.stmt.changes !== 1) {
          throw new Error('Could not update queue item id')
        }
      } catch(err) {
        // well, we tryed...
      }
    }

    // success!
    ctx.acknowledge({
      type: QUEUE_REMOVE+'_SUCCESS',
    })

    // tell room
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: QUEUE_UPDATE,
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

async function _isRoomOpen(roomId) {
  try {
    const q = squel.select()
      .from('rooms')
      .where('roomId = ?', roomId)

    const { text, values } = q.toParam()
    const room = await db.get(text, values)

    return (room && room.status === 'open')
  } catch(err) {
    log(err)
    return Promise.reject(err)
  }
}

module.exports = {
  ACTION_HANDLERS,
  getQueue,
  QUEUE_UPDATE,
}
