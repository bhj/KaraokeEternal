const project = require('../project.config')
const sqlite = require('sqlite')
const log = require('debug')(`app:scanner [${process.pid}]`)
const Prefs = require('./Prefs')
const FileScanner = require('./Media/FileScanner')
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_SCAN_CANCEL,
} = require('../constants/actions')

let _Scanner
let _isScanning = false
let _isScanQueued = false
let _isCanceling = false

log('Opening database file %s', project.database)

Promise.resolve()
  .then(() => sqlite.open(project.database, { Promise }))
  .then(() => {
    // setup start/stop handlers
    process.on('message', function ({ type, payload }) {
      if (type === SCANNER_WORKER_SCAN) {
        startScan() // enqueue a re-scan
      } else if (type === SCANNER_WORKER_SCAN_CANCEL) {
        cancelScan()
      }
    })

    return startScan()
  })
  .then(() => {
    if (!_isScanning) {
      return _Scanner.emitDone()
    }
  })
  .then(() => _Scanner.emitLibrary())
  .then(() => process.exit())

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
