const log = require('../lib/Log').getLogger(`server[${process.pid}]`)
const Library = require('../Library')
const Prefs = require('./Prefs')
const {
  LIBRARY_PUSH,
  PREFS_SET_PATH_PRIORITY,
  PREFS_PUSH,
  PREFS_SET,
  _ERROR,
} = require('../../shared/actionTypes')

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
  [PREFS_SET_PATH_PRIORITY]: async (sock, { payload }, acknowledge) => {
    if (!sock.user.isAdmin) {
      acknowledge({
        type: PREFS_SET_PATH_PRIORITY + _ERROR,
        error: 'Unauthorized',
      })
    }

    // not async!
    Prefs.setPathPriority(payload)
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

module.exports = ACTION_HANDLERS
