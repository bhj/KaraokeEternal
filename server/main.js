#!/usr/bin/env node
require('dotenv').config()
const childProcess = require('child_process')
const path = require('path')
const env = require('./lib/cli')
const log = require('./lib/Log')
  .set('console', env.KF_SERVER_CONSOLE_LEVEL, env.NODE_ENV === 'development' ? 5 : 4)
  .set('file', env.KF_SERVER_LOG_LEVEL, env.NODE_ENV === 'development' ? 0 : 3)
  .getLogger(`main[${process.pid}]`)
const Database = require('./lib/Database')
const IPC = require('./lib/IPCBridge')
const YoutubeProcessManager = require('./Youtube/YoutubeProcessManager')
const refs = {}
const {
  SCANNER_CMD_START,
  SCANNER_CMD_STOP,
  SERVER_WORKER_ERROR,
  SERVER_WORKER_STATUS,
} = require('../shared/actionTypes')

Object.keys(env).forEach(key => log.verbose(`${key} = ${env[key]}`))

// close db before exiting (can't do async in the 'exit' handler)
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// make sure child processes don't hang around
process.on('exit', function () {
  if (refs.scanner) refs.scanner.kill()
  YoutubeProcessManager.killYoutubeProcess()
})

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection:', p, 'reason:', reason)
})

// detect electron
if (process.versions.electron) {
  refs.electron = require('./lib/electron.js')({ env })
  env.KF_SERVER_PATH_DATA = refs.electron.app.getPath('userData')
}

Database.open({ readonly: false, env }).then(db => {
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

  // scanning on startup?
  if (env.KF_SERVER_SCAN) {
    startScanner()
  }
})

function startScanner () {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')

    // workaround to get debugging in child processes
    let options = { env: { ...env, KF_CHILD_PROCESS: 'scanner' } }
    if (process.env.NODE_ENV === 'development') {
      options.execArgv = ['--inspect=5723']
    }

    refs.scanner = childProcess.fork(path.join(__dirname, 'scannerWorker.js'), [], options)

    refs.scanner.on('exit', (code, signal) => {
      log.info(`Media scanner exited (${signal || code})`)
      IPC.removeChild(refs.scanner)
      delete refs.scanner
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
  log.info('Received signal %s', signal)

  Database.close().then(() => {
    log.info('Goodbye for now...')
    process.exit(0)
  })
}
