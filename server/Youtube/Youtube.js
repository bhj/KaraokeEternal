const IPC = require('../lib/IPCBridge')
const {
  YOUTUBE_WORKER_STATUS,
} = require('../../shared/actionTypes')

class Youtube {
  constructor () {
    this.isCanceling = false
    this.emitStatus = this.getStatusEmitter()
  }

  cancel () {
    this.isCanceling = true
  }

  getStatusEmitter () {
    return (text, pct, isProcessing = true) => {
      IPC.send({
        type: YOUTUBE_WORKER_STATUS,
        payload: {
          isProcessing,
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

module.exports = Youtube
