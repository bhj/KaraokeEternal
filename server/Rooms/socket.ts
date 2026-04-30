import Rooms from './Rooms.js'
import {
  ROOM_PREFS_PUSH_REQUEST,
  ROOM_PREFS_PUSH,
  _ERROR,
} from '../../shared/actionTypes.js'

const ACTION_HANDLERS = {
  [ROOM_PREFS_PUSH_REQUEST]: async (sock, { payload }, acknowledge) => {
    const { roomId } = payload

    const canManageRoom = sock.user.isAdmin
      || (sock.user.role === 'room_manager' && Rooms.isManager(roomId, sock.user.userId))

    if (!canManageRoom || !roomId) {
      return acknowledge({
        type: ROOM_PREFS_PUSH_REQUEST + _ERROR,
        error: 'Unauthorized',
      })
    }

    const sockets = await sock.server.in(Rooms.prefix(roomId)).fetchSockets()

    for (const s of sockets) {
      const recipientCanSee = s?.user.isAdmin
        || (s?.user.role === 'room_manager' && Rooms.isManager(roomId, s.user.userId))

      if (recipientCanSee) {
        sock.server.to(s.id).emit('action', {
          type: ROOM_PREFS_PUSH,
          payload,
        })
      }
    }
  },
}

export default ACTION_HANDLERS
