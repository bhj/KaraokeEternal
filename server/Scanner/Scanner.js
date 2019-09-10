const throttle = require('../lib/async-throttle')
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
    return throttle((text, progress) => {
      process.send({
        type: SCANNER_WORKER_STATUS,
        payload: { text, progress },
      })
    }, 1000)
  }
}

module.exports = Scanner
