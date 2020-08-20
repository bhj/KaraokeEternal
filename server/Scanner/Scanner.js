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
    return (text, progress, isScanning = true) => {
      process.send({
        type: SCANNER_WORKER_STATUS,
        payload: {
          isScanning,
          progress,
          text,
        },
      })
    }
  }
}

module.exports = Scanner
