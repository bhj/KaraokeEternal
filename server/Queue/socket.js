const db = require('../lib/Database').db
const sql = require('sqlate')
const Queue = require('./Queue')
const Rooms = require('../Rooms')

const {
  QUEUE_ADD,
  QUEUE_MOVE,
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
    fields.set('prevQueueId', sql`(
      SELECT queueId
      FROM queue
      WHERE roomId = ${sock.user.roomId} AND queueId NOT IN (
        SELECT prevQueueId
        FROM queue
        WHERE prevQueueId IS NOT NULL
      )
    )`)

    const query = sql`
      INSERT INTO queue ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    if (res.changes !== 1) {
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
  [QUEUE_MOVE]: async (sock, { payload }, acknowledge) => {
    const { queueId, prevQueueId } = payload

    try {
      await Rooms.validate(sock.user.roomId, null, { validatePassword: false })
    } catch (err) {
      return acknowledge({
        type: QUEUE_MOVE + '_ERROR',
        error: err.message,
      })
    }

    await Queue.move({
      prevQueueId,
      queueId,
      roomId: sock.user.roomId,
    })

    // success
    acknowledge({ type: QUEUE_MOVE + '_SUCCESS' })

    // tell room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId)
    })
  },
  [QUEUE_REMOVE]: async (sock, { payload }, acknowledge) => {
    const { queueId } = payload

    await Queue.remove({
      queueId,
      roomId: sock.user.roomId,
      userId: sock.user.isAdmin ? undefined : sock.user.userId,
    })

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
