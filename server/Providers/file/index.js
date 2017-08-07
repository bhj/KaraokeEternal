const FileScanner = require('./FileScanner')
const api = require('./api')

module.exports = {
  Scanner: FileScanner,
  Router: api,
}
