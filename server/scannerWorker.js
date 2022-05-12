const path = require('path')
const log = require('./lib/Log')(`scanner[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const {
  SCANNER_CMD_START,
  SCANNER_CMD_STOP,
} = require('../shared/actionTypes')

let FileScanner, Prefs
let _Scanner
let _isScanQueued = true

Database.open({
  file: path.join(process.env.KES_PATH_DATA, 'database.sqlite3'),
  ro: true,
}).then(db => {
  Prefs = require('./Prefs')
  FileScanner = require('./Scanner/FileScanner')

  IPC.use({
    [SCANNER_CMD_START]: async () => {
      log.info('Media scan requested (restarting)')
      _isScanQueued = true
      cancelScan()
    },
    [SCANNER_CMD_STOP]: async () => {
      log.info('Stopping media scan (user requested)')
      _isScanQueued = false
      cancelScan()
    }
  })

  startScan()
}).catch(err => {
  log.error(err.message)
  process.exit(1)
})

async function startScan () {
  log.info('Starting media scan')

  while (_isScanQueued) {
    _isScanQueued = false

    const prefs = await Prefs.get()
    _Scanner = new FileScanner(prefs)
    await _Scanner.scan()
  } // end while

  process.exit(0)
}

function cancelScan () {
  if (_Scanner) {
    _Scanner.cancel()
  }
}
