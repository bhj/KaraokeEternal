const Library = require('../Library')
const {
  SCANNER_WORKER_STATUS,
  SCANNER_WORKER_DONE,
  LIBRARY_PUSH,
} = require('../../shared/actions')

// handle a few IPC messages from scanner
module.exports = function (io) {
  process.on('message', async function (action) {
    if (action.type === SCANNER_WORKER_STATUS ||
      action.type === SCANNER_WORKER_DONE) {
      // broadcast to all clients
      io.emit('action', action)
    }

    // emit library when scanner finishes
    if (action.type === SCANNER_WORKER_DONE) {
      io.emit('action', {
        type: LIBRARY_PUSH,
        payload: await Library.get(),
      })
    }
  })
}
