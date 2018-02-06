const { promisify } = require('util')
const { resolve } = require('path')
const fs = require('fs')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

async function getFiles (dir) {
  let subdirs

  try {
    subdirs = await readdir(dir)
  } catch (err) {
    subdirs = []
  }

  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir)
    return (await stat(res)).isDirectory() ? getFiles(res) : res
  }))

  return files.reduce((a, f) => a.concat(f), [])
}

module.exports = getFiles
