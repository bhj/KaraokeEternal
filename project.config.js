const path = require('path')
const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = {
  /** Environment to use when building the project */
  env: NODE_ENV,
  /** Full path to the project's root directory */
  basePath: __dirname,
  /** path for all project assets (relative to the website root) */
  publicPath: '/',
  /** Port the http server listens on */
  serverPort: 3000,
  /** Full path to database file */
  database: path.resolve(__dirname, 'database.sqlite3'),
  /** Modules to bundle separately from the core client application */
  vendors: [
    'react',
    'react-dom',
    'redux',
    'react-redux',
    'redux-thunk',
    'react-router',
  ],
}
