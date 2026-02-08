import Rooms from './Rooms.js'
import { sanitizeRoomPrefsForClient } from './sanitizeRoomPrefs.js'
import {
  ROOM_PREFS_PUSH_REQUEST,
  ROOM_PREFS_PUSH,
  _ERROR,
} from '../../shared/actionTypes.js'

const ACTION_HANDLERS = {
  [ROOM_PREFS_PUSH_REQUEST]: async (sock, { payload }, acknowledge) => {
    const { roomId } = payload

    if (!sock.user.isAdmin || !roomId) {
      acknowledge({
        type: ROOM_PREFS_PUSH_REQUEST + _ERROR,
        error: 'Unauthorized',
      })
      return // CRITICAL: Must return to prevent unauthorized execution
    }

    const sockets = await sock.server.in(Rooms.prefix(roomId)).fetchSockets()

    for (const s of sockets) {
      const prefs = s?.user.isAdmin ? payload.prefs : sanitizeRoomPrefsForClient(payload.prefs)
      sock.server.to(s.id).emit('action', {
        type: ROOM_PREFS_PUSH,
        payload: { roomId, prefs },
      })
    }
  },
}

export default ACTION_HANDLERS
