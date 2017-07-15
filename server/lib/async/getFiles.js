const path = require('path')
const stat = require('./stat')
const readdir = require('./readdir')

// based on http://stackoverflow.com/a/38314404/2533525
const getFiles = function (dir, filterFn) {
  // default filter function accepts all files
  filterFn = filterFn || function () { return true }

  return readdir(dir).then(function (list) {
    return Promise.all(list.map(function (file) {
      file = path.resolve(dir, file)
      return stat(file).then(function (stat) {
        if (stat.isDirectory()) {
          return getFiles(file, filterFn)
        } else {
          return filterFn(file) ? file : ''
        }
      })
    })).then(function (results) {
      return results.filter(function (f) {
        return !!f
      })
    })
  }).then(function (results) {
    // flatten the array of arrays
    return Array.prototype.concat.apply([], results)
  })
}

module.exports = getFiles
