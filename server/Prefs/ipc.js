const Library = require('../Library')
const {
  SCANNER_WORKER_STATUS,
  SCANNER_WORKER_DONE,
  LIBRARY_PUSH,
} = require('../../shared/actions')

// handle a few IPC messages from scanner
module.exports = function (io) {
  process.on('message', async function (action) {
    // broadcast scanner status updates
    if (action.type === SCANNER_WORKER_STATUS || action.type === SCANNER_WORKER_DONE) {
      io.emit('action', action)
    }

    if (action.type === SCANNER_WORKER_DONE) {
      Library.setLibraryVersion()

      // broadcast library
      io.emit('action', {
        type: LIBRARY_PUSH,
        payload: await Library.get(),
      })
    }
  })
}
