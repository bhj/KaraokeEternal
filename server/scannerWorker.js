const path = require('path')
const log = require('./lib/Log')(`scanner[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const { parsePathIds } = require('./lib/util')
const {
  REQUEST_SCAN,
  REQUEST_SCAN_STOP,
  SCANNER_WORKER_STATUS,
} = require('../shared/actionTypes')

;(async function () {
  IPC.use({
    [REQUEST_SCAN]: ({ payload }) => {
      q.queue(payload.pathIds) // no need to await; fire and forget
    },
    [REQUEST_SCAN_STOP]: () => {
      q.stop()
    }
  })

  await Database.open({
    file: path.join(process.env.KES_PATH_DATA, 'database.sqlite3'),
    ro: true,
  })

  const ScannerQueue = require('./Scanner/ScannerQueue')
  const q = new ScannerQueue(onIteration, onDone)
  const args = process.argv.slice(2)
  log.verbose('received arguments: %s', args)

  if (!args.length) {
    process.exit(1) // eslint-disable-line n/no-process-exit
  }

  const pathIds = parsePathIds(args[0])
  log.verbose('parsed pathIds: %s', pathIds)

  q.queue(pathIds)
})()

function onIteration (stats) {
  // @todo
}

function onDone () {
  IPC.send({
    type: SCANNER_WORKER_STATUS,
    payload: {
      isScanning: false,
      pct: 100,
      text: 'Finished',
    },
  })

  process.exit(0) // eslint-disable-line n/no-process-exit
}
