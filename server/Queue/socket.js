const db = require('sqlite')
const squel = require('squel')
const Queue = require('./Queue')
const log = require('debug')('app:socket:queue')

const {
  QUEUE_ADD,
  QUEUE_REMOVE,
  QUEUE_PUSH,
} = require('../../constants/actions')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (sock, { payload }, acknowledge) => {
    // is room open?
    try {
      if (!await _isRoomOpen(sock.user.roomId)) {
        return acknowledge({
          type: QUEUE_ADD + '_ERROR',
          meta: {
            error: 'Room is no longer open'
          }
        })
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // verify media exists
    try {
      const q = squel.select()
        .from('media')
        .where('mediaId = ?', payload.mediaId)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (!row) {
        return acknowledge({
          type: QUEUE_ADD + '_ERROR',
          meta: {
            error: 'mediaId not found: ' + payload.mediaId
          }
        })
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // insert queue item
    try {
      const q = squel.insert()
        .into('queue')
        .set('roomId', sock.user.roomId)
        .set('mediaId', payload.mediaId)
        .set('userId', sock.user.userId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        throw new Error('Could not add media item to queue')
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // to all in room
    sock.server.to(sock.user.roomId).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.getQueue(sock.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (sock, { payload }, acknowledge) => {
    const { queueId } = payload
    let item, nextItem

    // is room open?
    try {
      if (!await _isRoomOpen(sock.user.roomId)) {
        return acknowledge({
          type: QUEUE_REMOVE + '_ERROR',
          meta: {
            error: 'Room is no longer open'
          }
        })
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // verify item exists
    try {
      const q = squel.select()
        .from('queue')
        .where('queueId = ?', queueId)

      const { text, values } = q.toParam()
      item = await db.get(text, values)
    } catch (err) {
      return Promise.reject(err)
    }

    if (!item) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        meta: {
          error: 'queueId not found: ' + queueId
        }
      })
    }

    // is it in the user's room?
    if (item.roomId !== sock.user.roomId) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        meta: {
          error: 'queueId is not in your room: ' + queueId
        }
      })
    }

    // is it the user's item?
    if (item.userId !== sock.user.userId) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        meta: {
          error: 'Item is NOT YOURS: ' + queueId
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
    } catch (err) {
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
    } catch (err) {
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
      } catch (err) {
        // well, we tryed...
      }
    }

    // tell room
    sock.server.to(sock.user.roomId).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.getQueue(sock.user.roomId)
    })
  },
}

async function _isRoomOpen (roomId) {
  try {
    const q = squel.select()
      .from('rooms')
      .where('roomId = ?', roomId)

    const { text, values } = q.toParam()
    const room = await db.get(text, values)

    return (room && room.status === 'open')
  } catch (err) {
    log(err)
    return Promise.reject(err)
  }
}

module.exports = ACTION_HANDLERS
