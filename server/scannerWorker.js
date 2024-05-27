const path = require('path')
const log = require('./lib/Log')(`scanner[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const { parsePathIds } = require('./lib/util')
const {
  MEDIA_CLEANUP,
  REQUEST_SCAN,
  REQUEST_SCAN_STOP,
  SCANNER_WORKER_PATH_SCANNED,
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

  const q = require('./Scanner/ScannerQueue')

  const args = process.argv.slice(2)
  log.verbose('received arguments: %s', args)

  if (args.length) {
    const pathIds = parsePathIds(args[0])
    log.verbose('parsed pathIds: %s', pathIds)

    await q.queue(pathIds)
    await q.start(onPathScanned)
  }

  IPC.send({
    type: SCANNER_WORKER_STATUS,
    payload: {
      isScanning: false,
      pct: 100,
      text: 'Finished',
    },
  })

  // process won't exit automatically due to the IPC message listener
  process.exit(0) // eslint-disable-line n/no-process-exit
})()

async function onPathScanned ({ length }) {
  // clean up before emitting library/queue if this is the last path
  if (length === 0) {
    await IPC.req({ type: MEDIA_CLEANUP })
  }

  await IPC.req({ type: SCANNER_WORKER_PATH_SCANNED })
}
