// thunk for webpack in dev environment
function readFile (compiler, filename) {
  return new Promise(function (resolve, reject) {
    compiler.outputFileSystem.readFile(filename, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })
}

module.exports = readFile
