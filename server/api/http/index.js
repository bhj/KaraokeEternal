const user = require('./user')
const prefs = require('./prefs')

const Providers = require('../../providers')
let ROUTE_HANDLERS = {
  user,
  prefs,
}

// provider routes
for (let p in Providers) {
  if (typeof Providers[p].ROUTE_HANDLERS === 'object') {
    ROUTE_HANDLERS[p] = Providers[p].ROUTE_HANDLERS
  }
}

module.exports = ROUTE_HANDLERS
