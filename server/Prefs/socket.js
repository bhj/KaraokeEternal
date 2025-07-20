import getLogger from '../lib/Log.js'
import Library from '../Library/Library.js'
import Prefs from './Prefs.js'
import { LIBRARY_PUSH, PREFS_PATH_SET_PRIORITY, PREFS_PUSH, PREFS_SET, _ERROR } from '../../shared/actionTypes.ts'
const log = getLogger(`server[${process.pid}]`)

const ACTION_HANDLERS = {
  [PREFS_SET]: async (sock, { payload }, acknowledge) => {
    if (!sock.user.isAdmin) {
      acknowledge({
        type: PREFS_SET + _ERROR,
        error: 'Unauthorized',
      })
    }

    await Prefs.set(payload.key, payload.data)
    log.info('%s (%s) set pref %s = %s', sock.user.name, sock.id, payload.key, payload.data)

    await pushPrefs(sock)
  },
  [PREFS_PATH_SET_PRIORITY]: async (sock, { payload }, acknowledge) => {
    if (!sock.user.isAdmin) {
      acknowledge({
        type: PREFS_PATH_SET_PRIORITY + _ERROR,
        error: 'Unauthorized',
      })
    }

    await Prefs.setPathPriority(payload)
    log.info('%s re-prioritized media folders; pushing library to all', sock.user.name)

    await pushPrefs(sock)

    // invalidate cache
    Library.cache.version = null

    sock.server.emit('action', {
      type: LIBRARY_PUSH,
      payload: await Library.get(),
    })
  },
}

// helper to push prefs to admins
const pushPrefs = async (sock) => {
  const admins = []

  for (const s of sock.server.sockets.sockets.values()) {
    if (s.user && s.user.isAdmin) {
      admins.push(s.id)
      sock.server.to(s.id)
    }
  }

  if (admins.length) {
    sock.server.emit('action', {
      type: PREFS_PUSH,
      payload: await Prefs.get(),
    })
  }
}

export default ACTION_HANDLERS
