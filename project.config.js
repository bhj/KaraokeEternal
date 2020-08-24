const path = require('path')
const NODE_ENV = process.env.NODE_ENV || 'production'
const KF_LOG_LEVEL = parseInt(process.env.KF_LOG_LEVEL, 10)

module.exports = {
  // environment to use when building the project
  env: NODE_ENV,
  // absolute path of project root
  basePath: __dirname,
  // absolute path to assets
  assetPath: path.join(__dirname, 'assets'),
  // absolute path of webpack output (npm run build)
  buildPath: path.join(__dirname, 'build'),
  // log file level (0=off, 1=error, 2=warn, 3=info, 4=verbose, 5=debug)
  logLevel: NODE_ENV === 'development' ? 0 : KF_LOG_LEVEL || 2,
}
