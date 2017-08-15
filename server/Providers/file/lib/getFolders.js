const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

// based on http://stackoverflow.com/a/38314404/2533525
const getFolders = function (dir, filterFn) {
  // default filter function accepts all folders
  filterFn = filterFn || function () { return true }

  return readdir(dir).then(list => {
    return Promise.all(list.map(file => {
      file = path.resolve(dir, file)
      return stat(file).then(stat => {
        if (stat.isDirectory()) {
          return filterFn(file) ? file : ''
        }
      }).catch(err => {
        // stat failed for this folder
        console.error(err.message)
      })
    })).then(results => {
      return results.filter(f => {
        return !!f
      })
    })
  }).then(results => {
    // flatten the array of arrays
    return Array.prototype.concat.apply([], results)
  })
}

module.exports = getFolders
