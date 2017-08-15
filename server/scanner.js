const db = require('sqlite')
const log = require('debug')(`app:scanner [${process.pid}]`)
const project = require('../project.config')
const Providers = require('./Providers/Providers')
const {
  PROVIDER_REQUEST_SCAN,
  PROVIDER_REQUEST_SCAN_CANCEL
} = require('../actions')

module.exports = function scanner () {
  log('Opening database file %s', project.database)
  db.open(project.database).then(() => {
    process.on('message', function ({ type }) {
      if (type === PROVIDER_REQUEST_SCAN) {
        Providers.startScan()
      } else if (type === PROVIDER_REQUEST_SCAN_CANCEL) {
        Providers.cancelScan()
      }
    })

    log('ready')
  })
}
