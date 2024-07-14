const path = require('path')
const log = require('../../lib/Log')('FileScanner')
const fs = require('fs')
const JSON5 = require('json5')
const CONFIG = '_kes.v2.json'

// search each folder from dir up to baseDir
function getConfig (dir, baseDir) {
  dir = path.normalize(dir)
  baseDir = path.normalize(baseDir)
  const cfgPath = path.resolve(dir, CONFIG)

  try {
    const userScript = fs.readFileSync(cfgPath, 'utf-8')
    log.info('Using custom parser config: %s', cfgPath)

    try {
      return JSON5.parse(userScript)
    } catch (err) {
      log.error(err)
    }
  } catch (err) {
    log.verbose('No parser config found: %s', dir)
  }

  if (dir === baseDir) {
    log.info('Using default parser config')
    return
  }

  // try parent dir
  return getConfig(path.resolve(dir, '..'), baseDir)
}

module.exports = getConfig
