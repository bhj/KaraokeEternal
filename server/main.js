const childEnv = require('./lib/cli')()
const log = require('./lib/logger')(`master[${process.pid}]`)
const path = require('path')
const childProcess = require('child_process')
const refs = {}
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_DONE,
  SERVER_WORKER_STATUS,
  SERVER_WORKER_ERROR,
} = require('../shared/actions')

Object.keys(childEnv).forEach(key => log.verbose(`${key} = ${childEnv[key]}`))

// make sure child processes don't hang around
process.on('exit', function () {
  if (refs.server) refs.server.kill()
  if (refs.scanner) refs.scanner.kill()
})

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// detect electron
if (process.versions['electron']) {
  refs.electron = require('./electron.js')
  childEnv.KF_USER_PATH = refs.electron.app.getPath('userData')
}

startServer()

function startServer () {
  if (refs.server === undefined) {
    log.info('Starting server process')
    refs.server = childProcess.fork(path.join(__dirname, 'server.js'), [], {
      env: childEnv,
    })

    refs.server.on('exit', (code, signal) => {
      log.info(`Server exited (${signal || code})`)
      process.exit(code)
    })

    refs.server.on('message', function (action) {
      if (refs.scanner) {
        // all IPC messages are relayed to scanner
        refs.scanner.send(action)
      } else if (action.type === SCANNER_WORKER_SCAN) {
        startScanner()
      }

      // @todo make generic action handler for electron
      if (refs.electron) {
        if (action.type === SERVER_WORKER_STATUS) {
          return refs.electron.setStatus('url', action.payload.url)
        } else if (action.type === SERVER_WORKER_ERROR) {
          return refs.electron.setError(action.error)
        }
      }
    })
  }
}

function startScanner () {
  if (refs.scanner === undefined) {
    log.info('Starting media scanner process')
    refs.scanner = childProcess.fork(path.join(__dirname, 'scanner.js'), [], {
      env: childEnv,
    })

    refs.scanner.on('exit', (code, signal) => {
      log.info(`Media scanner exited (${signal || code})`)

      refs.server.send({ type: SCANNER_WORKER_DONE })
      delete refs.scanner
    })

    refs.scanner.on('message', function (action) {
      // all IPC messages are relayed to web server
      refs.server.send(action)
    })
  }
}
