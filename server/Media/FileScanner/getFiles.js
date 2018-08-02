const { promisify } = require('util')
const { resolve } = require('path')
const fs = require('fs')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

async function getFiles (dir, extra) {
  let subdirs

  try {
    subdirs = await readdir(dir)
  } catch (err) {
    subdirs = []
  }

  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir)
    return (await stat(res)).isDirectory() ? getFiles(res, extra) : { file: res, ...extra }
  }))

  return files.reduce((a, f) => a.concat(f), [])
}

module.exports = getFiles
