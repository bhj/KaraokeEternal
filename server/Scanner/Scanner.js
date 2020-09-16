const IPC = require('../lib/IPCBridge')
const {
  SCANNER_WORKER_STATUS,
} = require('../../shared/actionTypes')

class Scanner {
  constructor () {
    this.isCanceling = false
    this.emitStatus = this.getStatusEmitter()
  }

  cancel () {
    this.isCanceling = true
  }

  getStatusEmitter () {
    return (text, pct, isScanning = true) => {
      IPC.send({
        type: SCANNER_WORKER_STATUS,
        payload: {
          isScanning,
          pct,
          text,
        },
        meta: {
          noAck: true,
        }
      })
    }
  }
}

module.exports = Scanner
