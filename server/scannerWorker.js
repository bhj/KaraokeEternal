const path = require('path')
const log = require('./lib/Log')(`scanner[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const {
  SCANNER_CMD_STOP,
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_PATH_SCANNED,
} = require('../shared/actionTypes')

let FileScanner, Prefs
let _Scanner
let pathQueue = []

Database.open({
  file: path.join(process.env.KES_PATH_DATA, 'database.sqlite3'),
  ro: true,
}).then(db => {
  Prefs = require('./Prefs')
  FileScanner = require('./Scanner/FileScanner')

  IPC.use({
    [SCANNER_WORKER_SCAN]: ({ payload }) => {
      log.info('Media path queued for scan (pathId=%s)', payload.pathId)
      pathQueue.push(payload.pathId)

      if (!_Scanner) startScan()
    },
    [SCANNER_CMD_STOP]: () => {
      log.info('Stopping media scan (user requested)')
      pathQueue = []
      cancelScan()
    }
  })
}).catch(err => {
  log.error(err.message)

  // scanner process won't exit automatically due to the
  // IPC message listener; forcing exit here for now
  process.exit(1) // eslint-disable-line n/no-process-exit
})

async function startScan () {
  log.info('Starting media scan')

  while (pathQueue.length) {
    const prefs = await Prefs.get()
    _Scanner = new FileScanner(prefs)

    await _Scanner.scan(pathQueue.shift())

    // push updated library/queue after each completed path
    await IPC.req({ type: SCANNER_WORKER_PATH_SCANNED })
  }

  // scanner process won't exit automatically due to the
  // IPC message listener; forcing exit here for now
  process.exit(0) // eslint-disable-line n/no-process-exit
}

function cancelScan () {
  if (_Scanner) {
    _Scanner.cancel()
  }
}
