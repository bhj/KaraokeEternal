const project = require('../project.config')
const sqlite = require('sqlite')
const log = require('debug')(`app:scanner [${process.pid}]`)
const Prefs = require('./Prefs')
const FileScanner = require('./Prefs/FileScanner')
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_SCAN_CANCEL,
} = require('../constants/actions')

let _Scanner
let _isScanning = false
let _isScanQueued = false
let _isCanceling = false
let _isDbOpen = false

// handle start/stop actions
process.on('message', function ({ type, payload }) {
  if (type === SCANNER_WORKER_SCAN && _isDbOpen) {
    startScan()
  } else if (type === SCANNER_WORKER_SCAN_CANCEL) {
    cancelScan()
  }
})

log('Opening database file %s', project.database)

Promise.resolve()
  .then(() => sqlite.open(project.database, { Promise }))
  .then(() => {
    _isDbOpen = true
    return startScan()
  })
  .then(() => {
    if (!_isScanning) {
      process.exit()
    }
  })

async function startScan () {
  if (_isScanning) {
    if (_isScanQueued) {
      log(`  => skipping request (media scan already queued)`)
    } else {
      _isScanQueued = true
      log(`  => media scan queued`)
    }

    return
  }

  log(`  => starting scan`)
  _isScanning = true
  _isScanQueued = true
  _isCanceling = false

  while (_isScanQueued && !_isCanceling) {
    _isScanQueued = false

    try {
      // paths may have changed
      const prefs = await Prefs.get()

      _Scanner = new FileScanner(prefs)
      await _Scanner.scan()
    } catch (err) {
      log(err)
    }
  } // end while

  _Scanner.emitDone()
  _Scanner.emitLibrary()

  _Scanner = null
  _isScanning = false
  _isCanceling = false
  _isScanQueued = false
}

function cancelScan () {
  if (_Scanner) {
    _isCanceling = true
    _Scanner.cancel()
  }
}
