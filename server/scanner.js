const db = require('sqlite')
const log = require('debug')(`app:scanner [${process.pid}]`)
const project = require('../project.config')
const Prefs = require('./Prefs')
const {
  PREFS_REQUEST_SCAN,
  PREFS_REQUEST_SCAN_CANCEL
} = require('../constants/actions')

module.exports = function scanner () {
  log('Opening database file %s', project.database)
  db.open(project.database).then(() => {
    process.on('message', function ({ type, payload }) {
      if (type === PREFS_REQUEST_SCAN) {
        Prefs.startScan()
      } else if (type === PREFS_REQUEST_SCAN_CANCEL) {
        Prefs.cancelScan()
      }
    })

    log('ready')
  })
}
