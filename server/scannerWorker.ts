import path from 'path'
import { parsePathIds } from './lib/util.js'
import { initLogger } from './lib/Log.js'
import {
  REQUEST_SCAN,
  REQUEST_SCAN_STOP,
  SCANNER_WORKER_STATUS,
} from '../shared/actionTypes.js'

const env = JSON.parse(process.env.KES_ENV_JSON)
const log = initLogger('scanner', {
  console: {
    level: env.KES_SCANNER_CONSOLE_LEVEL ?? (env.NODE_ENV === 'development' ? 5 : 4),
    useStyles: env.KES_CONSOLE_COLORS ?? undefined,
  },
  file: {
    level: env.KES_SCANNER_LOG_LEVEL ?? (env.NODE_ENV === 'development' ? 0 : 3),
  },
}).scope(`scanner[${process.pid}]`)

let IPC

;(async function () {
  // init database
  const { open } = await import('./lib/Database.js')

  open({
    file: path.join(env.KES_PATH_DATA, 'database.sqlite3'),
    ro: true,
  })

  // init IPC listener
  const IPCBridge = await import('./lib/IPCBridge.js')
  IPC = IPCBridge.default

  IPC.use({
    [REQUEST_SCAN]: ({ payload }) => {
      q.queue(payload.pathIds) // no need to await; fire and forget
    },
    [REQUEST_SCAN_STOP]: () => {
      q.stop()
    },
  })

  const { default: ScannerQueue } = await import('./Scanner/ScannerQueue.js')
  const q = new ScannerQueue(onIteration, onDone)
  const args = process.argv.slice(2)
  log.debug('received arguments: %s', args)

  if (!args.length) {
    process.exit(1) // eslint-disable-line n/no-process-exit
  }

  const pathIds = parsePathIds(args[0])
  log.debug('parsed pathIds: %s', pathIds)

  q.queue(pathIds)
})()

const totals = { new: 0, existing: 0, removed: 0 }

function onIteration (stats) {
  if (stats) {
    totals.new += stats.new
    totals.existing += stats.existing
    totals.removed += stats.removed
  }

  return stats
}

function onDone () {
  IPC.send({
    type: SCANNER_WORKER_STATUS,
    payload: {
      isScanning: false,
      pct: 100,
      text: `Scan finished (${totals.new} new, ${totals.removed} removed)`,
    },
  })

  process.exit(0) // eslint-disable-line n/no-process-exit
}
