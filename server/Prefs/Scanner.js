const throttle = require('../lib/throttle')
const Library = require('../Library')
const {
  LIBRARY_PUSH,
  PREFS_SCAN_STATUS,
} = require('../../constants/actions')

class Scanner {
  constructor () {
    this.isCanceling = false

    this.emitLibrary = this.getMediaEmitter()
    this.emitStatus = this.getStatusEmitter()
    this.emitDone = this.emitStatus.bind(this, '', 0, false)
  }

  cancel () {
    this.isCanceling = true
  }

  getStatusEmitter () {
    return throttle((text, progress, isUpdating = true) => {
      // thunkify
      return Promise.resolve().then(() => {
        process.send({
          type: PREFS_SCAN_STATUS,
          payload: { text, progress, isUpdating },
        })
      })
    }, 500)
  }

  getMediaEmitter () {
    return throttle(async () => {
      process.send({
        type: LIBRARY_PUSH,
        payload: await Library.get(),
      })
    }, 2000)
  }
}

module.exports = Scanner
