const process = require('./process')
const media = require('./media')

module.exports = {
  isLocal: true,
  extensions: ['.cdg'],
  processor: process,
  router: media,
}
