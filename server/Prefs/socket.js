const log = require('../lib/logger')(`server[${process.pid}]`)
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

    log.info('%s (%s) set preference %s = %s', sock.user.name, sock.id, payload.key, payload.data)
    await Prefs.set(payload.key, payload.data)

    // only push to admins
    const admins = Object.keys(sock.server.sockets.connected)
      .filter(id => sock.server.sockets.connected[id].user.isAdmin)

    if (admins.length) {
      admins.forEach(id => sock.server.to(id))

      sock.server.emit('action', {
        type: PREFS_PUSH,
        payload: await Prefs.get(),
      })
    }
  },
}

module.exports = ACTION_HANDLERS
