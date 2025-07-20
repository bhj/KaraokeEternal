import IPC from '../lib/IPCBridge.js'
import { SCANNER_WORKER_STATUS } from '../../shared/actionTypes.ts'

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

export default Scanner
