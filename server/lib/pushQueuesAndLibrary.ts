import Library from '../Library/Library.js'
import Queue from '../Queue/Queue.js'
import Rooms from '../Rooms/Rooms.js'
import { LIBRARY_PUSH, QUEUE_PUSH } from '../../shared/actionTypes.js'

function pushQueuesAndLibrary (io): void {
  // emit (potentially) updated queues to each room
  // it's important that this happens before the library is pushed,
  // otherwise queue items might reference newly non-existent songs
  for (const { room, roomId } of Rooms.getActive(io)) {
    io.to(room).emit('action', {
      type: QUEUE_PUSH,
      payload: Queue.get(roomId),
    })
  }

  // invalidate cache
  Library.cache.version = null

  io.emit('action', {
    type: LIBRARY_PUSH,
    payload: Library.get(),
  })
}

export default pushQueuesAndLibrary
