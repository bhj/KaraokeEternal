const cluster = require('cluster')
const log = require('debug')(`app:master [${process.pid}]`)
const serverWorker = require('./server')
const scannerWorker = require('./scanner')
const {
  SERVER_WORKER_STATUS,
} = require('../constants/actions')

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

if (cluster.isMaster) {
  (function () {
    const refs = {}

    if (process.versions['electron']) {
      refs.electron = require('./electron.js')
    }

    function watchDog () {
      checkServer()
      checkScanner()
    }

    function checkServer () {
      if (refs.server === undefined) {
        log('Starting web server')
        refs.server = cluster.fork({ ROLE: 'server' })

        refs.server.on('exit', function () {
          log('Web server died :(')
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
        refs.scanner = cluster.fork({ ROLE: 'scanner' })

        refs.scanner.on('exit', function () {
          log('Media scanner died :(')
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
  })()
} else {
  if (process.env.ROLE === 'server') { serverWorker() }
  if (process.env.ROLE === 'scanner') { scannerWorker() }
}
