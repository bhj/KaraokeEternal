const db = require('sqlite')
const sql = require('sqlate')
const Queue = require('./Queue')
const Rooms = require('../Rooms')

const {
  QUEUE_ADD,
  QUEUE_REMOVE,
  QUEUE_PUSH,
} = require('../../shared/actionTypes')

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (sock, { payload }, acknowledge) => {
    try {
      await Rooms.validate(sock.user.roomId, null, { validatePassword: false })
    } catch (err) {
      return acknowledge({
        type: QUEUE_ADD + '_ERROR',
        error: err.message,
      })
    }

    const fields = new Map()
    fields.set('roomId', sock.user.roomId)
    fields.set('songId', payload.songId)
    fields.set('userId', sock.user.userId)

    const query = sql`
      INSERT INTO queue ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    if (res.stmt.changes !== 1) {
      throw new Error('Could not add song to queue')
    }

    // success
    acknowledge({ type: QUEUE_ADD + '_SUCCESS' })

    // to all in room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (sock, { payload }, acknowledge) => {
    let whereClause = sql`queueId = ${payload.queueId} AND roomId = ${sock.user.roomId}`

    // admins can remove any
    if (!sock.user.isAdmin) {
      whereClause += sql` AND userId = ${sock.user.userId}`
    }

    const query = sql`
      DELETE FROM queue
      WHERE ${whereClause}
    `
    const res = await db.run(String(query), query.parameters)

    if (!res.stmt.changes) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        error: 'Could not remove queueId: ' + payload.queueId,
      })
    }

    // success
    acknowledge({ type: QUEUE_REMOVE + '_SUCCESS' })

    // tell room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId)
    })
  },
}

module.exports = ACTION_HANDLERS
