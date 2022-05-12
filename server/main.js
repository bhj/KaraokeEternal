#!/usr/bin/env node
const childProcess = require('child_process')
const path = require('path')
const env = require('./lib/cli')
const { Log } = require('./lib/Log')

const log = new Log('server', {
  console: Log.resolve(env.KES_CONSOLE_LEVEL, env.NODE_ENV === 'development' ? 5 : 4),
  file: Log.resolve(env.KES_LOG_LEVEL, env.NODE_ENV === 'development' ? 0 : 3),
}).setDefaultInstance().logger.scope(`main[${process.pid}]`)

const scannerLog = new Log('scanner', {
  console: Log.resolve(process.env.KES_SCAN_CONSOLE_LEVEL, process.env.NODE_ENV === 'development' ? 5 : 4),
  file: Log.resolve(process.env.KES_SCAN_LOG_LEVEL, process.env.NODE_ENV === 'development' ? 0 : 3),
}).logger.scope('scanner')

const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const refs = {}
const {
  SCANNER_CMD_START,
  SCANNER_CMD_STOP,
  SERVER_WORKER_ERROR,
  SCANNER_WORKER_LOG,
  SERVER_WORKER_STATUS,
} = require('../shared/actionTypes')

// handle scanner logs
// @todo: this doesn't need to be async
IPC.use({
  [SCANNER_WORKER_LOG]: async (action) => {
    scannerLog[action.payload.level](action.payload.msg)
  }
})

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

// close db before exiting (can't do async in the 'exit' handler)
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// make sure child processes don't hang around
process.on('exit', function () {
  if (refs.server) refs.server.kill()
  if (refs.scanner) refs.scanner.kill()
})

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection:', p, 'reason:', reason)
})

// detect electron
if (process.versions.electron) {
  refs.electron = require('./lib/electron.js')({ env })
  env.KES_PATH_DATA = refs.electron.app.getPath('userData')
}

Database.open({
  file: path.join(env.KES_PATH_DATA, 'database.sqlite3'),
  ro: false,
}).then(db => {
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
  require('./serverWorker.js')({ env, startScanner, stopScanner })
}).catch(err => {
  log.error(err.message)
  process.exit(1)
})

function startScanner (onExit) {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')
    refs.scanner = childProcess.fork(path.join(__dirname, 'scannerWorker.js'), [], {
      env: { ...env, KES_CHILD_PROCESS: 'scanner' },
      gid: Number.isInteger(env.KES_PGID) ? env.KES_PGID : undefined,
      uid: Number.isInteger(env.KES_PUID) ? env.KES_PUID : undefined,
    })

    refs.scanner.on('exit', (code, signal) => {
      log.info(`Media scanner exited (${signal || code})`)
      IPC.removeChild(refs.scanner)
      delete refs.scanner

      if (typeof onExit === 'function') onExit()
    })

    IPC.addChild(refs.scanner)
  } else {
    IPC.send({ type: SCANNER_CMD_START })
  }
}

function stopScanner () {
  if (refs.scanner) {
    IPC.send({ type: SCANNER_CMD_STOP })
  }
}

function shutdown (signal) {
  log.info('Received %s', signal)

  Database.close().then(() => {
    log.info('Goodbye for now...')
    process.exit(0)
  }).catch(err => {
    log.error(err.message)
    process.exit(1)
  })
}
