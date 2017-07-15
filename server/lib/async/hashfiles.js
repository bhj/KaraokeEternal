let fs = require('fs')
let crypto = require('crypto')

module.exports = exports = function (files, method) {
  return new Promise(async function (resolve, reject) {
    let hash = crypto.createHash(method).setEncoding('hex')

    if (!Array.isArray(files)) files = [files]

    for (let file of files) {
      let fd = fs.createReadStream(file)

      try {
        await doPipe(fd, hash)
      } catch (err) {
        return reject(err)
      }
    }

    hash.end()
    return resolve(hash.read())
  })
}

function doPipe (fd, hash) {
  return new Promise(function (resolve, reject) {
    fd.on('end', function () {
      return resolve()
    })

    fd.on('error', function (err) {
      return reject(err)
    })

    fd.on('data', function (data) {
      hash.update(data)
    })
  })
}
