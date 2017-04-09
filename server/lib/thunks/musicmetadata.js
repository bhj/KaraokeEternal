const fs = require('fs')
const mm = require('musicmetadata')

// create a new parser from a node ReadStream
module.exports = exports = function (file, opts = {}) {
  return new Promise(function (resolve, reject) {
    var parser = mm(fs.createReadStream(file), opts, function (err, metadata) {
      if (err) return reject(err)
      return resolve(metadata)
    })
  })
}
