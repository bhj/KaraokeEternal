const project = require('../config/project.config')
const server = require('../server/main')
const debug = require('debug')('app:bin:dev-server')
const db = require('sqlite')

// initialize database
Promise.resolve()
  .then(() => {
    db.open(project.path_database, { Promise })
    debug('Opened database file %s', project.path_database)
    server.listen(project.server_port)
    debug(`Server is now running at http://localhost:${project.server_port}.`)
  })
  .catch(err => debug(err.stack))
