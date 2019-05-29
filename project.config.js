const path = require('path')
const NODE_ENV = process.env.NODE_ENV || 'production'
const KF_USER_PATH = process.env.KF_USER_PATH || __dirname
const KF_SERVER_PORT = parseInt(process.env.KF_SERVER_PORT, 10)
const KF_LOG_LEVEL = parseInt(process.env.KF_LOG_LEVEL, 10)

module.exports = {
  // environment to use when building the project
  env: NODE_ENV,
  // full path to the project's root directory
  basePath: __dirname,
  // http server host: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
  serverHost: '0.0.0.0',
  // http server port
  serverPort: NODE_ENV === 'development' ? 3000 : isNaN(KF_SERVER_PORT) ? 0 : KF_SERVER_PORT,
  // full path to database file
  database: path.join(KF_USER_PATH, 'database.sqlite3'),
  // log file level (0=off, 1=error, 2=warn, 3=info, 4=verbose, 5=debug)
  logLevel: NODE_ENV === 'development' ? 0 : KF_LOG_LEVEL || 2,
}
