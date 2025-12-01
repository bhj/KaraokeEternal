import path from 'path'
import getLogger from '../../lib/Log.js'
import fs from 'fs'
import JSON5 from 'json5'
const log = getLogger('FileScanner')
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
  } catch {
    log.verbose('No parser config found: %s', dir)
  }

  if (dir === baseDir) {
    log.info('Using default parser config')
    return
  }

  // try parent dir
  return getConfig(path.resolve(dir, '..'), baseDir)
}

export default getConfig
