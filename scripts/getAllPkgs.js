const fs = require('fs')
const path = require('path')

/**
 * Gets the names of all top-level packages in a
 * node_modules folder, handling namespaces
 * @return {Array}
 */
function getAllSync (dir) {
  const dirs = fs.readdirSync(dir)
  const out = []

  dirs.forEach(d => {
    if (!d.startsWith('@')) {
      out.push(d)
      return
    }

    const subDirs = fs.readdirSync(path.join(dir, d))

    subDirs.forEach(s => {
      if (fs.statSync(path.join(dir, d, s)).isDirectory()) {
        out.push(d + '/' + s)
      }
    })
  })

  return out
}

module.exports = getAllSync
