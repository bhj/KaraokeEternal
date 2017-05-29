const user = require('./user')
const prefs = require('./prefs')
const rooms = require('./rooms')
const Providers = require('./providers')

let ROUTE_HANDLERS = {
  user,
  prefs,
  rooms,
}

// provider routes
for (const name in Providers) {
  if (typeof Providers[name] === 'object') {
    for (const router in Providers[name]) {
      ROUTE_HANDLERS[name + '_' + router] = Providers[name][router]
    }
  }
}

module.exports = ROUTE_HANDLERS
