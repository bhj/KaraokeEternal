const log = require('debug')(`app:master [${process.pid}]`)
const path = require('path')
const childProcess = require('child_process')
const refs = {}
const {
  SCANNER_WORKER_SCAN,
  SERVER_WORKER_STATUS,
} = require('../constants/actions')

log('NODE_ENV =', process.env.NODE_ENV)

// these could hang around esp. when quitting via electron
process.on('exit', function () {
  if (refs.server) refs.server.kill()
  if (refs.scanner) refs.scanner.kill()
})

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// detect electron
if (process.versions['electron']) {
  refs.electron = require('./electron.js')
}

startServer()

function startServer () {
  if (refs.server === undefined) {
    log('Starting web server')
    refs.server = childProcess.fork(path.join(__dirname, 'server.js'))

    refs.server.on('exit', (code, signal) => {
      if (signal) {
        log(`Web server killed by ${signal}`)
      } else {
        log(`Web server exited with code: ${code}`)
      }

      delete refs.server
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
    log('Starting media scanner')
    refs.scanner = childProcess.fork(path.join(__dirname, 'scanner.js'))

    refs.scanner.on('exit', (code, signal) => {
      if (signal) {
        log(`Media scanner killed by ${signal}`)
      } else {
        log(`Media scanner exited with code: ${code}`)
      }

      delete refs.scanner
    })

    refs.scanner.on('message', function (action) {
      // all IPC messages are relayed to web server
      refs.server.send(action)
    })
  }
}
