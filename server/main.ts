#!/usr/bin/env node
import childProcess from 'child_process'
import env from './lib/cli.js'
import path from 'path'
import { initLogger } from './lib/Log.js'
import { parsePathIds } from './lib/util.js'
import {
  PREFS_PATHS_CHANGED,
  REQUEST_SCAN,
  REQUEST_SCAN_STOP,
  SCANNER_WORKER_EXITED,
  WATCHER_WORKER_EVENT,
  WATCHER_WORKER_WATCH,
} from '../shared/actionTypes.js'

const log = initLogger('server', {
  console: {
    level: env.KES_SERVER_CONSOLE_LEVEL ?? (env.NODE_ENV === 'development' ? 5 : 4),
    useStyles: env.KES_CONSOLE_COLORS ?? undefined,
  },
  file: {
    level: env.KES_SERVER_LOG_LEVEL ?? (env.NODE_ENV === 'development' ? 0 : 3),
  },
}).scope(`main[${process.pid}]`)

const refs: { scanner?: childProcess.ChildProcess, watcher?: childProcess.ChildProcess } = {}
const shutdownHandlers: Array<() => Promise<void>> = []
let IPC

process.on(PREFS_PATHS_CHANGED, startWatcher)

// log non-default settings
for (const key in env) {
  if (process.env[key]) log.verbose(`${key}=${process.env[key]}`)
}

// support PUID/PGID convention (group MUST be set before user!)
if (Number.isInteger(env.KES_PGID)) {
  log.verbose(`PGID=${env.KES_PGID}`)
  process.setgid(env.KES_PGID)
}

if (Number.isInteger(env.KES_PUID)) {
  log.verbose(`PUID=${env.KES_PUID}`)
  process.setuid(env.KES_PUID)
}

// graceful shutdown on normal termination signals (a clean exit)
['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'].forEach((signal) => {
  process.on(signal, () => shutdown(signal))
})

// an uncaught exception leaves the process in an unknown state: log it, run
// best-effort cleanup, then exit non-zero so a process manager treats it as a
// crash (and restarts) rather than a deliberate shutdown
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err?.stack || err)
  shutdown('uncaughtException', 1)
})

// make sure child processes don't hang around
process.on('exit', () => Object.values(refs).forEach(ref => ref.kill()))

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})

;(async function () {
  // init database
  const { open, close } = await import('./lib/Database.js')
  shutdownHandlers.push(async () => close())

  open({
    file: path.join(env.KES_PATH_DATA, 'database.sqlite3'),
    ro: false,
  })

  // init IPC listener
  const IPCBridge = await import('./lib/IPCBridge.js')
  IPC = IPCBridge.default

  IPC.use({
    [WATCHER_WORKER_EVENT]: ({ payload }) => {
      startScanner(payload.pathId)
    },
  })

  // start web server
  const serverWorker = await import('./serverWorker.js')
  serverWorker.default({ env, startScanner, stopScanner, shutdownHandlers })

  // scanning on startup? ("full" with no pathIds means all paths)
  const { pathIds, full } = parsePathIds(env.KES_SCAN)
  if (pathIds || full) startScanner(pathIds || true, full)

  // any paths with watching enabled?
  const { default: Prefs } = await import('./Prefs/Prefs.js')
  const { paths } = Prefs.get()

  if (paths.result.find(pathId => paths.entities[pathId].prefs?.isWatchingEnabled)) {
    startWatcher(paths)
  }
})()

function startWatcher (paths) {
  if (refs.watcher === undefined) {
    log.info('Starting folder watcher process')
    refs.watcher = childProcess.fork(path.join(import.meta.dirname, 'watcherWorker.js'), [], {
      env: { KES_ENV_JSON: JSON.stringify(env), KES_CHILD_PROCESS: 'watcher' },
      gid: Number.isInteger(env.KES_PGID) ? env.KES_PGID : undefined,
      uid: Number.isInteger(env.KES_PUID) ? env.KES_PUID : undefined,
    })

    refs.watcher.on('exit', (code, signal) => {
      log.info(`Folder watcher process exited (${signal || code})`)
      IPC.removeChild(refs.watcher)
      delete refs.watcher
    })

    IPC.addChild(refs.watcher)
  }

  IPC.send({
    type: WATCHER_WORKER_WATCH,
    payload: { paths },
  })
}

function startScanner (pathIds, full = false) {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')

    refs.scanner = childProcess.fork(path.join(import.meta.dirname, 'scannerWorker.js'), [pathIds.toString(), String(full)], {
      env: { KES_ENV_JSON: JSON.stringify(env), KES_CHILD_PROCESS: 'scanner' },
      gid: Number.isInteger(env.KES_PGID) ? env.KES_PGID : undefined,
      uid: Number.isInteger(env.KES_PUID) ? env.KES_PUID : undefined,
    })

    refs.scanner.on('exit', (code, signal) => {
      IPC.removeChild(refs.scanner)
      delete refs.scanner

      ;(process as NodeJS.EventEmitter).emit(SCANNER_WORKER_EXITED, { signal, code })
      log.info(`Media scanner process exited (${signal || code})`)
    })

    IPC.addChild(refs.scanner)
  } else {
    IPC.send({ type: REQUEST_SCAN, payload: { pathIds, full } })
  }
}

function stopScanner () {
  if (refs.scanner) {
    IPC.send({ type: REQUEST_SCAN_STOP })
  }
}

async function shutdown (reason, code = 0) {
  log.info('Shutting down (%s)', reason)

  // don't let a hung cleanup handler prevent exit; force the intended code
  setTimeout(() => process.exit(code), 10000) // eslint-disable-line n/no-process-exit

  await Promise.allSettled(shutdownHandlers.map(f => f()))
  process.exit(code) // eslint-disable-line n/no-process-exit
}
