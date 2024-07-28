import bcrypt from 'bcrypt'

function hash (myPlaintextPassword, saltRounds) {
  return new Promise(function (resolve, reject) {
    bcrypt.hash(myPlaintextPassword, saltRounds, function (err, hash) {
      if (err) { return reject(err) }
      return resolve(hash)
    })
  })
}

function compare (data, hash) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(data, hash, function (err, matched) {
      if (err) { return reject(err) }
      return resolve(matched)
    })
  })
}

export default {
  hash,
  compare,
}
