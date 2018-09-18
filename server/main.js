const childEnv = require('./lib/cli')()
const log = require('./lib/logger')(`master[${process.pid}]`)
const path = require('path')
const childProcess = require('child_process')
const refs = {}
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_DONE,
  SERVER_WORKER_STATUS,
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
      process.exit()
    })

    refs.server.on('message', function ({ type, payload }) {
      if (refs.scanner) {
        // all IPC messages are relayed to scanner
        refs.scanner.send({ type, payload })
      } else if (type === SCANNER_WORKER_SCAN) {
        startScanner()
      }

      // electron: show status in system tray
      if (type === SERVER_WORKER_STATUS && refs.electron) {
        return refs.electron.setStatus('url', payload.url)
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
