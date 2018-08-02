const debug = require('debug')
const log = debug('app:media:fileScanner:getFiles')
const { promisify } = require('util')
const { resolve } = require('path')
const fs = require('fs')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

async function getFiles (dir, extra) {
  let list = []

  try {
    list = await readdir(dir)
  } catch (err) {
    log(err)
  }

  const files = await Promise.all(list.map(async (item) => {
    const file = resolve(dir, item)
    return (await stat(file)).isDirectory() ? getFiles(file, extra) : { file, ...extra }
  }))

  return files.reduce((a, f) => a.concat(f), [])
}

module.exports = getFiles
