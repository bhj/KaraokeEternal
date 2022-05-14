const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const readdir = promisify(fs.readdir)

const getFolders = dir => readdir(dir, { withFileTypes: true })
  .then(list => Promise.all(list.map(ent => ent.isDirectory() ? path.resolve(dir, ent.name) : null)))
  .then(list => list.filter(f => !!f).sort())

module.exports = getFolders
