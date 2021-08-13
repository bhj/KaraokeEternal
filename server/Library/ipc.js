const Library = require('./Library')
const throttle = require('@jcoreio/async-throttle')
const {
  SCANNER_WORKER_STATUS,
  LIBRARY_PUSH,
  LIBRARY_MATCH_SONG,
} = require('../../shared/actionTypes')

/**
 * IPC action handlers
 */
module.exports = function (io) {
  const emit = throttle(action => io.emit('action', action), 1000)

  return {
    [LIBRARY_MATCH_SONG]: async ({ payload }) => Library.matchSong(payload),
    [SCANNER_WORKER_STATUS]: async action => {
      emit(action)

      // scanner finished?
      if (action.payload.isScanning === false) {
        // invalidate cache
        Library.cache.version = null

        io.emit('action', {
          type: LIBRARY_PUSH,
          payload: await Library.get(),
        })
      }
    }
  }
}
