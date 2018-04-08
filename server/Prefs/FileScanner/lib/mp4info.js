// adapted from https://gist.github.com/OllieJones/5ffb011fa3a11964154975582360391c
const fs = require('fs')

module.exports = function (file) {
  return new Promise(function (resolve, reject) {
    const buff = Buffer.alloc(600)

    fs.open(file, 'r', function (err, fd) {
      if (err) reject(err)

      fs.read(fd, buff, 0, buff.length, 0, function (err, bytesRead, buffer) {
        if (err) reject(err)

        const format = readfourcc(buff, ['ftyp'], 0)

        if (format !== 'mp42') {
          reject(new Error(`Read ftyp '${format}'; expected 'mp42'`))
        }

        const timescale = read32(buff, ['moov', 'mvhd'], 12)
        const duration = read32(buff, ['moov', 'mvhd'], 16)
        const width = read16(buff, ['moov', 'trak', 'stbl', 'avc1'], 24)
        const height = read16(buff, ['moov', 'trak', 'stbl', 'avc1'], 26)

        resolve({
          duration: duration / timescale,
          width,
          height,
        })
      })
    })
  })
}

function readfourcc (buff, fourcc, offset) {
  let start = 0
  for (let i = 0; i < fourcc.length; i++) {
    start = buff.indexOf(Buffer.from(fourcc[i]), start) + 4
  }
  return buff.toString('ascii', start + offset, start + offset + 4)
}

function read32 (buff, fourcc, offset) {
  let start = 0
  for (let i = 0; i < fourcc.length; i++) {
    start = buff.indexOf(Buffer.from(fourcc[i]), start) + 4
  }
  return buff.readUInt32BE(start + offset, 4)
}

function read16 (buff, fourcc, offset) {
  let start = 0
  for (let i = 0; i < fourcc.length; i++) {
    start = buff.indexOf(Buffer.from(fourcc[i]), start) + 4
  }
  return buff.readUInt16BE(start + offset, 2)
}
