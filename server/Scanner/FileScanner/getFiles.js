const fs = require('fs')
const path = require('path')
const log = require('../../lib/Log').getLogger('FileScanner:getFiles')

/**
 * Silly promise wrapper for synchronous walker
 *
 * We want a synchronous walker for performance, but FileScanner runs
 * the walker in a loop, which will block the (async) socket.io status
 * emissions unless we use setTimeout here. @todo is there a better way?
 *
 * @param  {string} dir      path to recursively list
 * @param  {function} filterFn filter function applied to each file
 * @return {array}          array of objects with path and stat properties
 */
function getFiles (dir, filterFn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(walkSync(dir, filterFn))
      } catch (err) {
        reject(err)
      }
    }, 0)
  })
}

/**
 * Directory walker that only throws if parent directory
 * can't be read. Errors stat-ing children are only logged.
 */
function walkSync (dir, filterFn) {
  let results = []
  const list = fs.readdirSync(dir)

  list.forEach(file => {
    let stats
    file = path.join(dir, file)

    try {
      stats = fs.statSync(file)
    } catch (err) {
      log.warn(err.message)
      return
    }

    if (stats && stats.isDirectory()) {
      try {
        results = results.concat(walkSync(file, filterFn))
      } catch (err) {
        log.warn(err.message)
      }
    } else {
      if (!filterFn || filterFn(file)) {
        results.push({ file, stats })
      }
    }
  })

  return results
}

module.exports = getFiles
