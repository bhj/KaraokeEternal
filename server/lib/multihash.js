let fs = require('fs')
let crypto = require('crypto')

export default function(files, method) {
  return new Promise(async function(resolve, reject) {
    let hash = crypto.createHash(method).setEncoding('hex')

    if (!Array.isArray(files)) files = [files];

    for (let file of files) {
      let fd = fs.createReadStream(file)
      await doPipe(fd, hash)
    }

    hash.end()
    return resolve(hash.read())
  })
}

function doPipe(fd, hash){
  return new Promise(function(resolve, reject) {
    fd.on('data', function(data){
      hash.update(data)
    })

    fd.on('end', function(){
      return resolve()
    })
  })
}
