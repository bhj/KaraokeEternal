const db = require('sqlite')
const squel = require('squel')
const Queue = require('./Queue')

const {
  QUEUE_ADD,
  QUEUE_REMOVE,
  QUEUE_PUSH,
} = require('../../shared/actions')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (sock, { payload }, acknowledge) => {
    // is room open?
    if (!await _isRoomOpen(sock.user.roomId)) {
      return acknowledge({
        type: QUEUE_ADD + '_ERROR',
        error: 'Room is no longer open',
      })
    }

    // verify media exists
    {
      const q = squel.select()
        .from('media')
        .where('mediaId = ?', payload.mediaId)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (!row) {
        return acknowledge({
          type: QUEUE_ADD + '_ERROR',
          error: 'mediaId not found: ' + payload.mediaId,
        })
      }
    }

    // insert queue item
    {
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
    }

    // success
    acknowledge({ type: QUEUE_ADD + '_SUCCESS' })

    // to all in room
    sock.server.to(sock.user.roomId).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.getQueue(sock.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (sock, { payload }, acknowledge) => {
    const { queueId } = payload

    // is room open?
    if (!await _isRoomOpen(sock.user.roomId)) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        error: 'Room is no longer open',
      })
    }

    // delete item
    const q = squel.delete()
      .from('queue')
      .where('queueId = ?', queueId)
      .where('roomId = ?', sock.user.roomId)
      .where('userId = ?', sock.user.userId)

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (!res.stmt.changes) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        error: 'Could not remove queueId: ' + queueId,
      })
    }

    // success
    acknowledge({ type: QUEUE_REMOVE + '_SUCCESS' })

    // tell room
    sock.server.to(sock.user.roomId).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.getQueue(sock.user.roomId)
    })
  },
}

async function _isRoomOpen (roomId) {
  const q = squel.select()
    .from('rooms')
    .where('roomId = ?', roomId)

  const { text, values } = q.toParam()
  const room = await db.get(text, values)

  return (room && room.status === 'open')
}

module.exports = ACTION_HANDLERS
