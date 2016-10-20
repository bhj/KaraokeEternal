const config = require('../config')
const server = require('../server/main')
const debug = require('debug')('app:bin:server')
const port = config.server_port
const db = require('sqlite')

// initialize database
Promise.resolve()
  .then(() => {
    db.open(config.path_database, { Promise })
    debug('Opened sqlite database %s', config.path_database)
    server.listen(port)
    debug(`Server is now running at http://localhost:${port}.`)
  })
  .catch(err => debug(err.stack))
