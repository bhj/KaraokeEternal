#!/usr/bin/env node
const childProcess = require('child_process')
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const env = require('./lib/cli')
const log = require('./lib/logger')(`main[${process.pid}]`)
const path = require('path')
const refs = {}
const {
  SCANNER_CMD_START,
  SCANNER_CMD_STOP,
  SERVER_WORKER_ERROR,
  SERVER_WORKER_STATUS,
} = require('../shared/actionTypes')

Object.keys(env).forEach(key => log.verbose(`${key} = ${env[key]}`))

// make sure child processes don't hang around
process.on('exit', function () {
  if (refs.scanner) refs.scanner.kill()
})

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// detect electron
if (process.versions.electron) {
  refs.electron = require('./electron.js')
  env.KF_USER_PATH = refs.electron.app.getPath('userData')
}

Database.open({ readonly: false, log: log.info }).then(db => {
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
})

function startScanner () {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')
    refs.scanner = childProcess.fork(path.join(__dirname, 'scannerWorker.js'), [], {
      env: { ...env, KF_CHILD_PROCESS: 'scanner' }
    })

    refs.scanner.on('exit', (code, signal) => {
      log.info(`Media scanner exited (${signal || code})`)
      IPC.unsubscribe(refs.scanner)
      delete refs.scanner
    })

    IPC.subscribe(refs.scanner)
  } else {
    IPC.emit({ type: SCANNER_CMD_START })
  }
}

function stopScanner () {
  if (refs.scanner) {
    IPC.emit({ type: SCANNER_CMD_STOP })
  }
}
