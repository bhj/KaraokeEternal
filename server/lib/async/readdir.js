const fs = require('fs')

module.exports = exports = function (dir) {
  return new Promise(function (resolve, reject) {
    fs.readdir(dir, function (err, list) {
      if (err) {
        return reject(err)
      }

      return resolve(list)
    })
  })
}
