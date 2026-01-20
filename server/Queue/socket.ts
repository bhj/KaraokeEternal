import Queue from './Queue.js'
import Rooms from '../Rooms/Rooms.js'
import { QUEUE_ADD, QUEUE_MOVE, QUEUE_REMOVE, QUEUE_PUSH } from '../../shared/actionTypes.js'

// Helper to check if user is the room owner
const isRoomOwner = async (userId: number, roomId: number): Promise<boolean> => {
  const res = await Rooms.get(roomId, { status: ['open', 'closed'] })
  return res.entities[roomId]?.ownerId === userId
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: async (sock, { payload }, acknowledge) => {
    const { songId } = payload

    try {
      await Rooms.validate(sock.user.roomId, null, { validatePassword: false })
    } catch (err) {
      return acknowledge({
        type: QUEUE_ADD + '_ERROR',
        error: err.message,
      })
    }

    await Queue.add({
      roomId: sock.user.roomId,
      songId,
      userId: sock.user.userId,
    })

    // success
    acknowledge({ type: QUEUE_ADD + '_SUCCESS' })

    // to all in room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId),
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

    if (
      !sock.user.isAdmin
      && !(await isRoomOwner(sock.user.userId, sock.user.roomId))
      && !(await Queue.isOwner(sock.user.userId, queueId))
    ) {
      return acknowledge({
        type: QUEUE_MOVE + '_ERROR',
        error: 'Cannot move another user\'s song',
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
      payload: await Queue.get(sock.user.roomId),
    })
  },
  [QUEUE_REMOVE]: async (sock, { payload }, acknowledge) => {
    const { queueId } = payload
    const ids = Array.isArray(queueId) ? queueId : [queueId]

    if (
      !sock.user.isAdmin
      && !(await isRoomOwner(sock.user.userId, sock.user.roomId))
      && !(await Queue.isOwner(sock.user.userId, ids))
    ) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        error: 'Cannot remove another user\'s song',
      })
    }

    for (const id of ids) {
      await Queue.remove(id)
    }

    // success
    acknowledge({ type: QUEUE_REMOVE + '_SUCCESS' })

    // tell room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(sock.user.roomId),
    })
  },
}

export default ACTION_HANDLERS
