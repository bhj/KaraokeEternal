const path = require('path')
const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = {
  /** Environment to use when building the project */
  env: NODE_ENV,
  /** Full path to the project's root directory */
  basePath: __dirname,
  /** path for all project assets (relative to website public_html) */
  publicPath: './',
  // http server host: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
  serverHost: '0.0.0.0',
  // http server port: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
  serverPort: 3000,
  /** Full path to database file */
  database: path.join(__dirname, 'database.sqlite3'),
}
