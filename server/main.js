const cluster = require('cluster')
const log = require('debug')(`app:master [${process.pid}]`)
const serverWorker = require('./server')
const scannerWorker = require('./scanner')

// debug: log stack trace for unhandled promise rejections
process.on('unhandledRejection', (reason, p) => {
  log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

if (cluster.isMaster) {
  (function () {
    const refs = {}

    function watchDog () {
      checkServer()
      checkScanner()
    }

    function checkServer () {
      if (refs.server === undefined) {
        log('starting web server')
        refs.server = cluster.fork({ ROLE: 'server' })

        refs.server.on('exit', function () {
          log('web server died :(')
          delete refs.server
        })

        refs.server.on('message', function (action) {
          // log('relaying to scanner: ' + JSON.stringify(action))
          refs.scanner.send(action)
        })
      }
    }

    function checkScanner () {
      if (refs.scanner === undefined) {
        log('starting media scanner')
        refs.scanner = cluster.fork({ ROLE: 'scanner' })

        refs.scanner.on('exit', function () {
          log('media scanner died :(')
          delete refs.scanner
        })

        refs.scanner.on('message', function (action) {
          // log('relaying to server: ' + JSON.stringify(action))
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
