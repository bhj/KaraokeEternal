const path = require('path')
const log = require('../../lib/logger')('FileScanner:getConfig')
const fs = require('fs')
const { NodeVM } = require('vm2')
const KF_CONFIG = '_kfconfig.js'

// search each folder from dir up to baseDir
function getConfig (dir, baseDir) {
  dir = path.normalize(dir)
  baseDir = path.normalize(baseDir)
  const cfgPath = path.resolve(dir, KF_CONFIG)

  try {
    const userScript = fs.readFileSync(cfgPath, 'utf-8')
    log.info('Found config: %s', cfgPath)

    try {
      const vm = new NodeVM({ wrapper: 'none' })
      return vm.run(userScript)
    } catch (err) {
      log.error(err)
    }
  } catch (err) {
    log.info(`No ${KF_CONFIG} found in ${dir}`)
  }

  if (dir === baseDir) {
    return
  }

  // try parent dir
  return getConfig(path.resolve(dir, '..'), baseDir)
}

module.exports = getConfig
