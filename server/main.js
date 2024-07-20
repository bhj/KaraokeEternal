#!/usr/bin/env node
const env = require('./lib/cli')
if (env.KES_EXIT) return

const { initLogger } = require('./lib/Log')
const log = initLogger('server', {
  console: env.KES_SERVER_CONSOLE_LEVEL ?? (process.env.NODE_ENV === 'development' ? 5 : 4),
  file: env.KES_SERVER_LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 0 : 3),
}).scope(`main[${process.pid}]`)

const childProcess = require('child_process')
const path = require('path')
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const { parsePathIds } = require('./lib/util')
const refs = {}
const shutdownHandlers = []
const {
  PREFS_PATHS_CHANGED,
  REQUEST_SCAN,
  REQUEST_SCAN_STOP,
  SCANNER_WORKER_EXITED,
  SERVER_WORKER_ERROR,
  SERVER_WORKER_STATUS,
  WATCHER_WORKER_EVENT,
  WATCHER_WORKER_WATCH,
} = require('../shared/actionTypes')

IPC.use({
  [WATCHER_WORKER_EVENT]: ({ payload }) => {
    startScanner(payload.pathId)
  },
})

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

// handle shutdown gracefully
['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach((event) => {
  process.on(event, shutdown)
})

// make sure child processes don't hang around
process.on('exit', () => Object.values(refs).forEach(ref => ref.kill()))

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection:', p, 'reason:', reason)
})

// detect electron
if (process.versions.electron) {
  refs.electron = require('./lib/electron.js')({ env })
  env.KES_PATH_DATA = refs.electron.app.getPath('userData')
}

(async function () {
  await Database.open({
    file: path.join(env.KES_PATH_DATA, 'database.sqlite3'),
    ro: false,
  })

  shutdownHandlers.push(Database.close)

  if (refs.electron) {
    process.on('serverWorker', action => {
      const { type, payload } = action

      if (type === SERVER_WORKER_STATUS) {
        return refs.electron.setStatus('url', payload.url)
      } else if (type === SERVER_WORKER_ERROR) {
        return refs.electron.setError(action.error)
      }
    })
  }

  // start web server
  require('./serverWorker.js')({ env, startScanner, stopScanner, shutdownHandlers })

  // scanning on startup?
  const pathIds = parsePathIds(env.KES_SCAN)
  if (pathIds) startScanner(pathIds)

  // any paths with watching enabled?
  const { paths } = await require('./Prefs').get()

  if (paths.result.find(pathId => paths.entities[pathId].prefs?.isWatchingEnabled)) {
    startWatcher(paths)
  }
})()

function startWatcher (paths) {
  if (refs.watcher === undefined) {
    log.info('Starting folder watcher process')
    refs.watcher = childProcess.fork(path.join(__dirname, 'watcherWorker.js'), [], {
      env: { ...env, KES_CHILD_PROCESS: 'watcher' },
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
    payload: { paths }
  })
}

function startScanner (pathIds) {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')

    refs.scanner = childProcess.fork(path.join(__dirname, 'scannerWorker.js'), [pathIds.toString()], {
      env: { ...env, KES_CHILD_PROCESS: 'scanner' },
      gid: Number.isInteger(env.KES_PGID) ? env.KES_PGID : undefined,
      uid: Number.isInteger(env.KES_PUID) ? env.KES_PUID : undefined,
    })

    refs.scanner.on('exit', (code, signal) => {
      IPC.removeChild(refs.scanner)
      delete refs.scanner

      process.emit(SCANNER_WORKER_EXITED, { signal, code })
      log.info(`Media scanner process exited (${signal || code})`)
    })

    IPC.addChild(refs.scanner)
  } else {
    IPC.send({ type: REQUEST_SCAN, payload: { pathIds } })
  }
}

function stopScanner () {
  if (refs.scanner) {
    IPC.send({ type: REQUEST_SCAN_STOP })
  }
}

async function shutdown (signal) {
  log.info('Received %s', signal)

  await Promise.allSettled(shutdownHandlers.map(f => f()))
  process.exit(0) // eslint-disable-line n/no-process-exit
}
