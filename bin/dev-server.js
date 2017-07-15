const project = require('../config/project.config')
const server = require('../server/main')
const debug = require('debug')('app:bin:dev-server')
const db = require('sqlite')

// open/init/migrate database and start koa server listen()
async function init () {
  try {
    debug('Opening database file %s', project.path_database)
    await db.open(project.path_database)

    debug('Running database migrations')
    await db.migrate({
      // force: 'last',
      migrationsPath: project.paths.server('lib/db'),
    })

    server.listen(project.server_port)
    debug(`Server is now running at http://${project.server_host}:${project.server_port}.`)
  } catch (e) {
    debug(e)
    process.exit(1)
  }
}

init()
