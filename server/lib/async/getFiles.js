const path = require('path')
const stat = require('./stat')
const readdir = require('./readdir')

// list all files in a folder (recursive)
// based on http://stackoverflow.com/a/38314404/2533525
const getFiles = function (dir) {
  return readdir(dir).then(list => {
    return Promise.all(list.map(file => {
      file = path.resolve(dir, file)

      return stat(file)
        .then(stats => stats.isDirectory() ? getFiles(file) : file)
    }))
  }).then(results => {
    // flatten the array of arrays
    return Array.prototype.concat.apply([], results)
  })
}

module.exports = getFiles
