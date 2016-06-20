import recursive from 'recursive-readdir'

export default function(path, ignore=[]) {
  return new Promise(function(resolve, reject) {
    recursive(path, ignore, function(err, files) {
      if (err) { return reject(err) }
      return resolve(files)
    })
  })
}
