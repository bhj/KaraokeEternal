const fs = require('fs')

module.exports = function (file) {
  return new Promise(function (resolve, reject) {
    fs.stat(file, function (err, stats) {
      if (err) {
        return reject(err)
      }

      return resolve(stats)
    })
  })
}
