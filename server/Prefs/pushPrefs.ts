import Prefs from './Prefs.js'
import { PREFS_PUSH } from '../../shared/actionTypes.js'
import type { Prefs as PrefsType } from '../../shared/types.js'

// push full prefs to admins; everyone else gets the sanitized provider subset
function pushPrefs (io): void {
  const adminIds = []
  const userIds = []

  for (const sock of io.sockets.sockets.values()) {
    if (!sock.user) continue
    ;(sock.user.isAdmin ? adminIds : userIds).push(sock.id)
  }

  const prefs = Prefs.get() as unknown as PrefsType

  if (adminIds.length) {
    io.to(adminIds).emit('action', {
      type: PREFS_PUSH,
      payload: prefs,
    })
  }

  if (userIds.length) {
    io.to(userIds).emit('action', {
      type: PREFS_PUSH,
      payload: { providers: Prefs.getSanitizedProviders(prefs.providers) },
    })
  }
}

export default pushPrefs
