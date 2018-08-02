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
let _isScanQueued = true

log('Opening database file %s', project.database)

Promise.resolve()
  .then(() => sqlite.open(project.database, { Promise }))
  .then(() => {
    // setup start/stop handlers
    process.on('message', function ({ type, payload }) {
      if (type === SCANNER_WORKER_SCAN) {
        log(`Media scan requested (restarting)`)
        _isScanQueued = true
        cancelScan()
      } else if (type === SCANNER_WORKER_SCAN_CANCEL) {
        log(`Stopping media scan (user requested)`)
        _isScanQueued = false
        cancelScan()
      }
    })

    return startScan()
  })

async function startScan () {
  log(`Starting media scan`)

  while (_isScanQueued) {
    _isScanQueued = false

    const prefs = await Prefs.get()
    _Scanner = new FileScanner(prefs)
    await _Scanner.scan()
  } // end while

  log(`Finished media scan; exiting`)
  process.exit()
}

function cancelScan () {
  if (_Scanner) {
    _Scanner.cancel()
  }
}
