import getLogger from '../lib/Log.js'
import Library from '../Library/Library.js'
import Prefs from './Prefs.js'
import { LIBRARY_PUSH, PREFS_PATH_SET_PRIORITY, PREFS_PUSH, PREFS_SET, _ERROR } from '../../shared/actionTypes.js'
const log = getLogger(`server[${process.pid}]`)

const ACTION_HANDLERS = {
  [PREFS_SET]: (sock, { payload }, acknowledge) => {
    if (!sock.user.isAdmin) {
      return acknowledge({
        type: PREFS_SET + _ERROR,
        error: 'Unauthorized',
      })
    }

    Prefs.set(payload.key, payload.data)
    log.info('%s (%s) set pref %s = %s', sock.user.name, sock.id, payload.key, payload.data)

    pushPrefs(sock)
  },
  [PREFS_PATH_SET_PRIORITY]: (sock, { payload }, acknowledge) => {
    if (!sock.user.isAdmin) {
      return acknowledge({
        type: PREFS_PATH_SET_PRIORITY + _ERROR,
        error: 'Unauthorized',
      })
    }

    Prefs.setPathPriority(payload)
    log.info('%s re-prioritized media folders; pushing library to all', sock.user.name)

    pushPrefs(sock)

    // invalidate cache
    Library.cache.version = null

    sock.server.emit('action', {
      type: LIBRARY_PUSH,
      payload: Library.get(),
    })
  },
}

// helper to push prefs to admins
const pushPrefs = (sock) => {
  const adminIds = []

  for (const s of sock.server.sockets.sockets.values()) {
    if (s.user && s.user.isAdmin) {
      adminIds.push(s.id)
    }
  }

  if (adminIds.length) {
    sock.server.to(adminIds).emit('action', {
      type: PREFS_PUSH,
      payload: Prefs.get(),
    })
  }
}

export default ACTION_HANDLERS
