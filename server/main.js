#!/usr/bin/env node
const childProcess = require('child_process')
const Database = require('./lib/Database')
const env = require('./lib/cli')()
const log = require('./lib/logger')(`main[${process.pid}]`)
const path = require('path')
const refs = {}

Object.keys(env).forEach(key => log.verbose(`${key} = ${env[key]}`))

// make sure child processes don't hang around
process.on('exit', function () {
  if (refs.scanner) refs.scanner.kill()
})

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// parent process' actions -> child process
process.on('serverWorker', function (action) {
  const { payload, type } = action

  if (refs.scanner) {
    refs.scanner.send(action)
  }

  // @todo
  // if (refs.electron) {
  //   if (type === SERVER_WORKER_STATUS) {
  //     return refs.electron.setStatus('url', payload.url)
  //   } else if (type === SERVER_WORKER_ERROR) {
  //     return refs.electron.setError(action.error)
  //   }
  // }
})

// detect electron
if (process.versions.electron) {
  refs.electron = require('./electron.js')
  env.KF_USER_PATH = refs.electron.app.getPath('userData')
}

Database.open({ readonly: false, log: log.info }).then(db => {
  require('./serverWorker.js')(startScanner)
})

function startScanner () {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')
    refs.scanner = childProcess.fork(path.join(__dirname, 'scannerWorker.js'), [], {
      env: { ...env, KF_CHILD_PROCESS: 'scanner' }
    })

    refs.scanner.on('exit', (code, signal) => {
      log.info(`Media scanner exited (${signal || code})`)
      delete refs.scanner
    })

    // child process' actions -> parent process
    refs.scanner.on('message', function (action) {
      process.emit('scannerWorker', action)
    })
  }
}
