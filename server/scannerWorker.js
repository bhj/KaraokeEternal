const config = require('../project.config')
const log = require('./lib/logger')(`scanner[${process.pid}]`)
const sqlite = require('sqlite')
const Prefs = require('./Prefs')
const FileScanner = require('./Scanner/FileScanner')
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_SCAN_CANCEL,
} = require('../shared/actions')

let _Scanner
let _isScanQueued = true

log.info('Opening database file %s', config.database)

Promise.resolve()
  .then(() => sqlite.open(config.database, { Promise }))
  .then(() => {
    // attach start/stop handlers
    process.on('message', function ({ type, payload }) {
      if (type === SCANNER_WORKER_SCAN) {
        log.info(`Media scan requested (restarting)`)
        _isScanQueued = true
        cancelScan()
      } else if (type === SCANNER_WORKER_SCAN_CANCEL) {
        log.info(`Stopping media scan (user requested)`)
        _isScanQueued = false
        cancelScan()
      }
    })

    return startScan()
  })

async function startScan () {
  log.info(`Starting media scan`)

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
