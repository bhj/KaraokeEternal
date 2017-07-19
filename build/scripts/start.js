const debug = require('debug')('app:server')
const server = require('../../server/main')
const project = require('../../project.config')
const db = require('sqlite')
const path = require('path')

const dbPath = path.resolve(project.basePath, project.database)
const migrationsPath = path.resolve(project.serverDir, 'lib', 'db')

// open/init/migrate database and start koa server listen()
async function init () {
  try {
    debug('Opening database file %s', dbPath)
    await db.open(dbPath)

    debug('Running database migrations')
    await db.migrate({
      migrationsPath,
      // force: 'last',
    })

    server.listen(project.serverPort)
    debug(`Server is now running on port ${project.serverPort}`)
  } catch (e) {
    debug(e)
    process.exit(1)
  }
}

init()
