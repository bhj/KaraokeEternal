const prefs = require('./prefs')
const rooms = require('./rooms')
const user = require('./user')

let ROUTE_HANDLERS = {
  prefs,
  rooms,
  user,
}

module.exports = ROUTE_HANDLERS
