const NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = {
  /** Environment to use when building the project */
  env: NODE_ENV,
  /** Full path to the project's root directory */
  basePath: __dirname,
  /** Directory containing the server source code */
  serverDir: 'server',
  /** Port the http server listens on */
  serverPort: 3000,
  /** Directory containing the client application source code */
  srcDir: 'src',
  /** Filename of the application's entry point */
  main: 'main',
  /** Filename of the SQLite database */
  database: 'database.sqlite3',
  /** Directory in which to emit compiled assets */
  outDir: 'dist',
  /** Base path for all project assets (relative to the website root) */
  publicPath: '/',
  /** Whether to generate sourcemaps */
  sourcemaps: true,
  /** Hash map of keys that the compiler should treat as external to the project */
  externals: {},
  /** Hash map of variables and their values to expose globally */
  globals: {},
  /** Whether to enable verbose logging */
  verbose: false,
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
