import {
  ROOM_PREFS_PUSH_REQUEST,
  ROOM_PREFS_PUSH,
  _ERROR,
} from '../../shared/actionTypes.js'

const ACTION_HANDLERS = {
  [ROOM_PREFS_PUSH_REQUEST]: async (sock, { payload }, acknowledge) => {
    if (!sock.user.isAdmin || !payload.roomId) {
      acknowledge({
        type: ROOM_PREFS_PUSH_REQUEST + _ERROR,
        error: 'Unauthorized',
      })
    }

    for (const s of sock.server.of('/').sockets.values()) {
      if (s?.user?.isAdmin && s?.user.roomId === payload.roomId) {
        sock.server.to(s.id).emit('action', {
          type: ROOM_PREFS_PUSH,
          payload,
        })
      }
    }
  },
}

export default ACTION_HANDLERS
