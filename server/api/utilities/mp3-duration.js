import mp3Duration from 'mp3-duration'

export default function(file) {
  return new Promise(function(resolve, reject) {
    mp3Duration(file, function(err, duration){
      if (err) { return reject(err) }
      return resolve(duration)
    })
  })
}
