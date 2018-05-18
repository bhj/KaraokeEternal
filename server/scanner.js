const project = require('../project.config')
const sqlite = require('sqlite')
const log = require('debug')(`app:scanner [${process.pid}]`)
const Prefs = require('./Prefs')
const {
  SCANNER_WORKER_SCAN,
  SCANNER_WORKER_SCAN_CANCEL
} = require('../constants/actions')

module.exports = function scanner () {
  log('Opening database file %s', project.database)

  Promise.resolve()
    .then(() => sqlite.open(project.database, { Promise }))

  process.on('message', function ({ type, payload }) {
    if (type === SCANNER_WORKER_SCAN) {
      Prefs.startScan()
    } else if (type === SCANNER_WORKER_SCAN_CANCEL) {
      Prefs.cancelScan()
    }
  })

  log('Media scanner ready')
}
