#!/usr/bin/env node
const childProcess = require('child_process')
const Database = require('./lib/Database')
const env = require('./lib/cli')()
const log = require('./lib/logger')(`main[${process.pid}]`)
const path = require('path')

const refs = {}
const {
  SCANNER_WORKER_SCAN,
  SERVER_WORKER_STATUS,
  SERVER_WORKER_ERROR,
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

process.on('message', function (action) {
  const { payload, type } = action
  if (refs.scanner) {
    // relay action from server to scanner
    refs.scanner.send(action)
  } else if (action.type === SCANNER_WORKER_SCAN) {
    startScanner()
  }

  // @todo make generic action handler for electron
  if (refs.electron) {
    if (type === SERVER_WORKER_STATUS) {
      return refs.electron.setStatus('url', payload.url)
    } else if (type === SERVER_WORKER_ERROR) {
      return refs.electron.setError(action.error)
    }
  }
})

// detect electron
if (process.versions.electron) {
  refs.electron = require('./electron.js')
  env.KF_USER_PATH = refs.electron.app.getPath('userData')
}

Database.open({ readonly: false, log: log.info }).then(db => {
  require('./serverWorker.js')() // not passing anything atm...
})

function startScanner () {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')
    refs.scanner = childProcess.fork(path.join(__dirname, 'scannerWorker.js'), [], {
      env: { ...env, KF_PROCESS_ROLE: 'scanner' }
    })

    refs.scanner.on('exit', (code, signal) => {
      log.info(`Media scanner exited (${signal || code})`)
      delete refs.scanner
    })

    // relay actions from scanner to server
    refs.scanner.on('message', function (action) {
      process.emit('message', action)
    })
  }
}
