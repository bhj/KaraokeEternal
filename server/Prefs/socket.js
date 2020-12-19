const log = require('../lib/Log').getLogger(`server[${process.pid}]`)
const Prefs = require('./Prefs')
const {
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

    log.info('%s (%s) set pref %s = %s', sock.user.name, sock.id, payload.key, payload.data)
    await Prefs.set(payload.key, payload.data)

    // only push to admins
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
  },
}

module.exports = ACTION_HANDLERS
