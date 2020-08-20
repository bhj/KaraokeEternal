const Library = require('./Library')
const log = require('../lib/logger')('Library:ipc')
const throttle = require('@jcoreio/async-throttle')
const {
  SCANNER_WORKER_STATUS,
  LIBRARY_PUSH,
  LIBRARY_MATCH,
  _SUCCESS,
  _ERROR,
} = require('../../shared/actionTypes')

const ACTION_HANDLERS = {
  [LIBRARY_MATCH]: async ({ payload }) => Library.match(payload),
}

/**
 * IPC action handler for scanner (db writes occur in server process)
 */
module.exports = function (io) {
  const emit = throttle(action => io.emit('action', action), 1000)

  process.on('message', async function (action) {
    const { type } = action

    // broadcast scanner status updates
    if (type === SCANNER_WORKER_STATUS) {
      emit(action)

      // scanner finished?
      if (action.payload.isScanning === false) {
        Library.setLibraryVersion()

        io.emit('action', {
          type: LIBRARY_PUSH,
          payload: await Library.get(),
        })
      }

      return
    }

    if (typeof ACTION_HANDLERS[type] !== 'function') {
      log.debug('ignoring action: %s', type)
      return
    }

    try {
      const res = await ACTION_HANDLERS[type](action)

      process.emit('message', {
        ...action,
        type: type + _SUCCESS,
        payload: res,
      })
    } catch (err) {
      process.emit('message', {
        ...action,
        type: type + _ERROR,
        error: err,
      })

      log.debug(`error in ipc action ${type}: ${err.message}`)
    }
  })
}
