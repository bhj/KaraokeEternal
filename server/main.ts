#!/usr/bin/env node
import childProcess from 'child_process'
import env from './lib/cli.js'
import path from 'path'
import { initLogger } from './lib/Log.js'
import { parsePathIds } from './lib/util.js'
import {
  PREFS_PATHS_CHANGED,
  REQUEST_SCAN,
  REQUEST_SCAN_FILE,
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

const refs: {
  pathScanner?: childProcess.ChildProcess
  fileScanner?: childProcess.ChildProcess
  watcher?: childProcess.ChildProcess
} = {}
const shutdownHandlers: Array<() => Promise<void>> = []
const WATCHER_PROVIDER_GRACE_MS = 3000
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
    [WATCHER_WORKER_EVENT]: async ({ payload }) => {
      const { default: ProviderFetch } = await import('./Providers/ProviderFetch.js')

      // Files a provider fetched are ingested on their own, so skip the scan
      // when they're all that changed.
      const check = () => {
        if (payload.files.every(file => ProviderFetch.isIngestedFile(file))) {
          log.verbose('watcher: ignoring provider-ingested file(s) in pathId %s', payload.pathId)
          return
        }

        startPathScanner(payload.pathId)
      }

      // An in-flight fetch's file can land before its `complete` event
      // arrives, so wait first (not airtight if the stream lags)
      if (ProviderFetch.hasInFlight()) setTimeout(check, WATCHER_PROVIDER_GRACE_MS)
      else check()
    },
  })

  // start web server
  const serverWorker = await import('./serverWorker.js')
  serverWorker.default({ env, startPathScanner, startFileScanner, stopPathScanner, shutdownHandlers })

  // scanning on startup? ("full" with no pathIds means all paths)
  const { pathIds, full } = parsePathIds(env.KES_SCAN)
  if (pathIds || full) startPathScanner(pathIds || true, full)

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

function forkScannerWorker (role: 'pathScanner' | 'fileScanner', argv: string[]): childProcess.ChildProcess {
  return childProcess.fork(path.join(import.meta.dirname, 'scannerWorker.js'), argv, {
    env: { KES_ENV_JSON: JSON.stringify(env), KES_CHILD_PROCESS: role },
    gid: Number.isInteger(env.KES_PGID) ? env.KES_PGID : undefined,
    uid: Number.isInteger(env.KES_PUID) ? env.KES_PUID : undefined,
  })
}

function startPathScanner (pathIds: number | number[] | true, full = false): void {
  if (refs.pathScanner === undefined) {
    log.info('Starting path scanner process')

    const csv = pathIds === true ? 'all' : (Array.isArray(pathIds) ? pathIds.join(',') : String(pathIds))
    refs.pathScanner = forkScannerWorker('pathScanner', full ? [`--pathIds=${csv}`, '--full'] : [`--pathIds=${csv}`])

    refs.pathScanner.on('exit', (code, signal) => {
      IPC.removeChild(refs.pathScanner)
      delete refs.pathScanner

      ;(process as NodeJS.EventEmitter).emit(SCANNER_WORKER_EXITED, { signal, code })
      log.info(`Path scanner process exited (${signal || code})`)
    })

    IPC.addChild(refs.pathScanner)
  } else {
    IPC.send({ type: REQUEST_SCAN, payload: { pathIds, full } }, refs.pathScanner.pid)
  }
}

function startFileScanner (
  opts: { absPath: string, pathId: number },
): Promise<{ mediaId: number, songId: number }> {
  if (refs.fileScanner === undefined) {
    log.info('Starting file scanner process')

    refs.fileScanner = forkScannerWorker('fileScanner', ['--file'])

    refs.fileScanner.on('exit', (code, signal) => {
      // IPC.removeChild rejects any in-flight IPC.req promises targeting this pid.
      IPC.removeChild(refs.fileScanner)
      delete refs.fileScanner

      log.info(`File scanner process exited (${signal || code})`)
    })

    IPC.addChild(refs.fileScanner)
  }

  return IPC.req(
    { type: REQUEST_SCAN_FILE, payload: opts },
    refs.fileScanner.pid,
  ) as Promise<{ mediaId: number, songId: number }>
}

function stopPathScanner () {
  if (refs.pathScanner) {
    IPC.send({ type: REQUEST_SCAN_STOP }, refs.pathScanner.pid)
  }
}

async function shutdown (reason, code = 0) {
  log.info('Shutting down (%s)', reason)

  // don't let a hung cleanup handler prevent exit; force the intended code
  setTimeout(() => process.exit(code), 10000) // eslint-disable-line n/no-process-exit

  await Promise.allSettled(shutdownHandlers.map(f => f()))
  process.exit(code) // eslint-disable-line n/no-process-exit
}
