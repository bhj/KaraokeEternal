import Queue from './Queue.js'
import Rooms from '../Rooms/Rooms.js'
import { QUEUE_ADD, QUEUE_MOVE, QUEUE_REMOVE, QUEUE_PUSH } from '../../shared/actionTypes.js'

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

    // Prevent the same user from queuing the same song consecutively.
    // Other users queuing the same song is allowed — only back-to-back
    // repeats by the same user are rejected.
    if (Queue.isLastQueuedSong(sock.user.roomId, sock.user.userId, songId)) {
      return acknowledge({
        type: QUEUE_ADD + '_ERROR',
        error: 'You already have this song at the end of the queue',
      })
    }

    Queue.add({
      roomId: sock.user.roomId,
      songId,
      userId: sock.user.userId,
    })

    // success
    acknowledge({ type: QUEUE_ADD + '_SUCCESS' })

    // to all in room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: Queue.get(sock.user.roomId),
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

    const canManageRoom = sock.user.isAdmin
      || (sock.user.role === 'room_manager' && Rooms.isManager(sock.user.roomId, sock.user.userId))

    // Standard/guest users may only move their own songs.
    // Admins and room managers may move any song in the queue.
    if (!canManageRoom && !(Queue.isOwner(sock.user.userId, queueId))) {
      return acknowledge({
        type: QUEUE_MOVE + '_ERROR',
        error: 'Cannot move another user\'s song',
      })
    }

    Queue.move({
      prevQueueId,
      queueId,
      roomId: sock.user.roomId,
    })

    // success
    acknowledge({ type: QUEUE_MOVE + '_SUCCESS' })

    // tell room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: Queue.get(sock.user.roomId),
    })
  },
  [QUEUE_REMOVE]: (sock, { payload }, acknowledge) => {
    const { queueId } = payload
    const ids = Array.isArray(queueId) ? queueId : [queueId]

    const canManageRoom = sock.user.isAdmin
      || (sock.user.role === 'room_manager' && Rooms.isManager(sock.user.roomId, sock.user.userId))

    if (!canManageRoom && !(Queue.isOwner(sock.user.userId, ids))) {
      return acknowledge({
        type: QUEUE_REMOVE + '_ERROR',
        error: 'Cannot remove another user\'s song',
      })
    }

    for (const id of ids) {
      Queue.remove(id)
    }

    // success
    acknowledge({ type: QUEUE_REMOVE + '_SUCCESS' })

    // tell room
    sock.server.to(Rooms.prefix(sock.user.roomId)).emit('action', {
      type: QUEUE_PUSH,
      payload: Queue.get(sock.user.roomId),
    })
  },
}

export default ACTION_HANDLERS
