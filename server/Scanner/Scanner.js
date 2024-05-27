const IPC = require('../lib/IPCBridge')
const {
  SCANNER_WORKER_STATUS,
} = require('../../shared/actionTypes')

class Scanner {
  constructor (qStats) {
    this.isCanceling = false
    this.emitStatus = this.getStatusEmitter(qStats)
  }

  cancel () {
    this.isCanceling = true
  }

  getStatusEmitter ({ length }) {
    return (text, progress, isScanning = true) => {
      IPC.send({
        type: SCANNER_WORKER_STATUS,
        payload: {
          isScanning,
          pct: (progress / length) * 100,
          text: length === 1 ? text : `[1/${length}] ${text}`,
        },
      })
    }
  }
}

module.exports = Scanner
