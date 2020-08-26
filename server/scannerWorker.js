const log = require('./lib/Log')
  .set('console', process.env.KF_SCANNER_CONSOLE_LEVEL, process.env.NODE_ENV === 'development' ? 5 : 4)
  .set('file', process.env.KF_SCANNER_LOG_LEVEL, process.env.NODE_ENV === 'development' ? 0 : 3)
  .getLogger(`scanner[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const {
  SCANNER_CMD_START,
  SCANNER_CMD_STOP,
} = require('../shared/actionTypes')

let FileScanner, Prefs
let _Scanner
let _isScanQueued = true

Database.open({ readonly: true, log: log.info }).then(db => {
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
