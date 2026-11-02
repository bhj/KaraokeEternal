import path from 'path'
import { parsePathIds } from './lib/util.js'
import { initLogger } from './lib/Log.js'
import {
  REQUEST_SCAN,
  REQUEST_SCAN_STOP,
  REQUEST_SCAN_FILE,
  SCANNER_WORKER_STATUS,
} from '../shared/actionTypes.js'

const env = JSON.parse(process.env.KES_ENV_JSON)

type Mode = 'path' | 'file'

interface ParsedArgs {
  mode: Mode
  pathIds?: number[] | true
  full?: boolean
}

function parseArgs (argv: string[]): ParsedArgs {
  const flags: Record<string, string | true> = {}

  for (const arg of argv) {
    if (!arg.startsWith('--')) continue
    const eq = arg.indexOf('=')
    if (eq === -1) flags[arg.slice(2)] = true
    else flags[arg.slice(2, eq)] = arg.slice(eq + 1)
  }

  const hasPath = typeof flags.pathIds === 'string'
  const hasFile = flags.file === true

  if (hasPath && hasFile) throw new Error('argv: --pathIds and --file are mutually exclusive')
  if (!hasPath && !hasFile) throw new Error('argv: expected --pathIds=<csv|all> or --file')

  if (hasPath) {
    // "full" is honored as its own flag or inside the spec itself, so the worker
    // can be run directly with the same spec as --scan (e.g. --pathIds=1,full)
    const parsed = parsePathIds(flags.pathIds === 'all' ? 'true' : flags.pathIds as string)
    const full = parsed.full || flags.full === true

    return {
      mode: 'path',
      // "full" with no pathIds means all paths
      pathIds: parsed.pathIds || (full ? true : undefined),
      full,
    }
  }

  return { mode: 'file' }
}

const args = process.argv.slice(2)
const parsedArgs = parseArgs(args)

const log = initLogger('scanner', {
  console: {
    level: env.KES_SCANNER_CONSOLE_LEVEL ?? (env.NODE_ENV === 'development' ? 5 : 4),
    useStyles: env.KES_CONSOLE_COLORS ?? undefined,
  },
  file: {
    level: env.KES_SCANNER_LOG_LEVEL ?? (env.NODE_ENV === 'development' ? 0 : 3),
  },
}).scope(`${parsedArgs.mode}Scanner[${process.pid}]`)

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

  log.debug('received arguments: %s', args)

  if (parsedArgs.mode === 'path') {
    await runPathScanner(parsedArgs.pathIds, parsedArgs.full === true)
  } else {
    await runFileScanner()
  }
})()

async function runPathScanner (initialPathIds: number[] | true | undefined, full: boolean): Promise<void> {
  const { default: PathScannerQueue } = await import('./Scanner/PathScannerQueue.js')

  const totals = { new: 0, updated: 0, removed: 0 }
  const q = new PathScannerQueue(
    (stats) => {
      if (stats) {
        totals.new += stats.new
        totals.updated += stats.updated
        totals.removed += stats.removed
      }
    },
    () => {
      // key order is the display order
      const summary = Object.entries(totals)
        .filter(([, n]) => n > 0)
        .map(([type, n]) => `${n} ${type}`)
        .join(', ')

      IPC.send({
        type: SCANNER_WORKER_STATUS,
        payload: {
          isScanning: false,
          pct: 100,
          text: `Scan finished (${summary || 'no changes'})`,
        },
      })
      // See file-scanner scheduleExitIfIdle for rationale: drain IPC before exit.
      if (process.connected) {
        process.once('disconnect', () => process.exit(0)) // eslint-disable-line n/no-process-exit
        process.disconnect()
      } else {
        process.exit(0) // eslint-disable-line n/no-process-exit
      }
    },
  )

  IPC.use({
    [REQUEST_SCAN]: ({ payload }) => {
      q.queue(payload.pathIds, payload.full === true) // no need to await; fire and forget
    },
    [REQUEST_SCAN_STOP]: () => {
      q.stop()
    },
  })

  if (initialPathIds === undefined || (Array.isArray(initialPathIds) && !initialPathIds.length)) {
    log.error('no pathIds derived from argv')
    process.exit(1) // eslint-disable-line n/no-process-exit
  }

  log.debug('parsed pathIds: %s (full=%s)', initialPathIds, full)

  q.queue(initialPathIds === true ? true : initialPathIds as number[], full)
}

async function runFileScanner (): Promise<void> {
  const { default: FileScanner } = await import('./Scanner/FileScanner.js')
  const { default: MetaParser } = await import('./Scanner/MetaParser/MetaParser.js')
  const { default: getConfig } = await import('./Scanner/PathScanner/getConfig.js')
  const { default: Prefs } = await import('./Prefs/Prefs.js')

  // Serialize REQUEST_SCAN_FILE requests through a single promise chain.
  // Exit when the chain is idle.
  let chain: Promise<unknown> = Promise.resolve()
  let pending = 0

  const scheduleExitIfIdle = () => {
    if (pending !== 0) return
    // Defer to the next macrotask via setImmediate, NOT queueMicrotask.
    // The bridge's auto-reply (process.send) is queued as a microtask on the
    // same promise we just settled — it has NOT run yet. queueMicrotask would
    // fire before that reply gets sent. setImmediate fires after all pending
    // microtasks, by which point process.send has been called. Then
    // process.disconnect() drains the pipe buffer before closing.
    setImmediate(() => {
      if (pending !== 0) return
      if (process.connected) {
        process.once('disconnect', () => process.exit(0)) // eslint-disable-line n/no-process-exit
        process.disconnect()
      } else {
        process.exit(0) // eslint-disable-line n/no-process-exit
      }
    })
  }

  IPC.use({
    [REQUEST_SCAN_FILE]: ({ payload }: { payload: { absPath: string, pathId: number } }) => {
      pending++
      const turn = chain
        .catch(() => {})
        .then(() => {
          const prefs = Prefs.get()
          const baseDir = prefs.paths.entities[payload.pathId]?.path
          if (!baseDir) throw new Error(`unknown pathId ${payload.pathId}`)
          const parser = MetaParser(getConfig(path.dirname(payload.absPath), baseDir))
          return new FileScanner(prefs).process(payload.absPath, payload.pathId, parser)
        })
        .finally(() => {
          pending--
          scheduleExitIfIdle()
        })
      chain = turn
      return turn
    },
  })
}
