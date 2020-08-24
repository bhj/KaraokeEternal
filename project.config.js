const path = require('path')

module.exports = {
  // absolute path of project root
  basePath: __dirname,
  // absolute path to assets
  assetPath: path.join(__dirname, 'assets'),
  // absolute path of webpack output (npm run build)
  buildPath: path.join(__dirname, 'build'),
}
