const library = require('./library')
const paths = require('./paths')
const prefs = require('./prefs')
const rooms = require('./rooms')
const user = require('./user')

let ROUTE_HANDLERS = {
  library,
  paths,
  prefs,
  rooms,
  user,
}

module.exports = ROUTE_HANDLERS
