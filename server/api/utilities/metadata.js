import fs from 'fs'
import mm from 'musicmetadata'

// create a new parser from a node ReadStream
export default function(file) {
  return new Promise(function(resolve, reject) {
    var parser = mm(fs.createReadStream(file), { duration: false }, function (err, metadata) {
      if (err) return reject(err)
      return resolve(metadata)
    })
  })
}
