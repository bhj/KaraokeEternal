const log = require('debug')(`app:master [${process.pid}]`)
const child_process = require('child_process')
const refs = {}
const {
  SERVER_WORKER_STATUS,
} = require('../constants/actions')

log('NODE_ENV =', process.env.NODE_ENV)

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

// detect electron
if (process.versions['electron']) {
  refs.electron = require('./electron.js')

  // NODE_ENV will not pass through to forked processes;
  // set it for them now based on electron dev/prod state
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = (process.defaultApp ||
      /node_modules[\\/]electron[\\/]/.test(process.execPath)) ? 'development' : 'production'
  }
}

function watchDog () {
  checkServer()
  checkScanner()
}

function checkServer () {
  if (refs.server === undefined) {
    log('Starting web server')
    refs.server = child_process.fork('./server/server.js')

    refs.server.on('exit', (code, signal) => {
      if (signal) {
        log(`Web server killed by signal: ${signal}`)
      } else if (code !== 0) {
        log(`Web server exited with error code: ${code}`)
      }

      delete refs.server
    })

    refs.server.on('message', function ({ type, payload }) {
      // electron: show status in system tray
      if (type === SERVER_WORKER_STATUS && refs.electron) {
        return refs.electron.setStatus('url', payload.url)
      }

      // all actions relayed to scanner
      refs.scanner.send({ type, payload })
    })
  }
}

function checkScanner () {
  if (refs.scanner === undefined) {
    log('Starting media scanner')
    refs.scanner = child_process.fork('./server/scanner.js')

    refs.scanner.on('exit', (code, signal) => {
      if (signal) {
        log(`Media scanner killed by signal: ${signal}`)
      } else if (code !== 0) {
        log(`Media scanner exited with error code: ${code}`)
      }

      delete refs.scanner
    })

    refs.scanner.on('message', function (action) {
      // all actions relayed to web server
      refs.server.send(action)
    })
  }
}

watchDog()
setInterval(watchDog, 1000)
