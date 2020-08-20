const Database = require('./lib/Database')
const log = require('./lib/logger')(`scanner[${process.pid}]`)
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_SCAN_CANCEL,
} = require('../shared/actionTypes')

let FileScanner, Prefs
let _Scanner
let _isScanQueued = true

// attach start/stop handlers
process.on('message', function ({ type, payload }) {
  if (type === SCANNER_WORKER_SCAN) {
    log.info('Media scan requested (restarting)')
    _isScanQueued = true
    cancelScan()
  } else if (type === SCANNER_WORKER_SCAN_CANCEL) {
    log.info('Stopping media scan (user requested)')
    _isScanQueued = false
    cancelScan()
  }
})

Database.open({ readonly: true, log: log.info }).then(db => {
  Prefs = require('./Prefs')
  FileScanner = require('./Scanner/FileScanner')

  startScan()
})

async function startScan () {
  log.info('Starting media scan')

  while (_isScanQueued) {
    _isScanQueued = false

    const prefs = await Prefs.get()
    _Scanner = new FileScanner(prefs)
    await _Scanner.scan()
  } // end while

  process.exit()
}

function cancelScan () {
  if (_Scanner) {
    _Scanner.cancel()
  }
}
