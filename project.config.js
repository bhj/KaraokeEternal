const path = require('path')
const NODE_ENV = process.env.NODE_ENV || 'development'
const KF_USER_PATH = process.env.KF_USER_PATH || __dirname

module.exports = {
  // environment to use when building the project
  env: NODE_ENV,
  // full path to the project's root directory
  basePath: __dirname,
  // location of index.html (relative to website public_html)
  publicPath: '/',
  // http server host: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
  serverHost: '0.0.0.0',
  // http server port: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
  serverPort: process.env.KF_SERVER_PORT || 3000,
  // full path to database file
  database: path.join(KF_USER_PATH, 'database.sqlite3'),
  // log file level (0=off, 1=error, 2=warn, 3=info, 4=verbose, 5=debug)
  logLevel: NODE_ENV === 'development' ? 0 : process.env.KF_LOG_LEVEL || 2,
}
