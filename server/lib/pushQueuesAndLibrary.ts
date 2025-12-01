import Library from '../Library/Library.js'
import Queue from '../Queue/Queue.js'
import Rooms from '../Rooms/Rooms.js'
import { LIBRARY_PUSH, QUEUE_PUSH } from '../../shared/actionTypes.js'

async function pushQueuesAndLibrary (io) {
  // emit (potentially) updated queues to each room
  // it's important that this happens before the library is pushed,
  // otherwise queue items might reference newly non-existent songs
  for (const { room, roomId } of Rooms.getActive(io)) {
    io.to(room).emit('action', {
      type: QUEUE_PUSH,
      payload: await Queue.get(roomId),
    })
  }

  // invalidate cache
  Library.cache.version = null

  io.emit('action', {
    type: LIBRARY_PUSH,
    payload: await Library.get(),
  })
}

export default pushQueuesAndLibrary
