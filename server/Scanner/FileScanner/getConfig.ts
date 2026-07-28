import path from 'path'
import getLogger from '../../lib/Log.js'
import fs from 'fs'
import JSON5 from 'json5'
import { CONFIG_FILENAME } from './scanUtils.js'
const log = getLogger('FileScanner')

// search each folder from dir up to baseDir
function getConfig (dir, baseDir) {
  dir = path.normalize(dir)
  baseDir = path.normalize(baseDir)
  const cfgPath = path.resolve(dir, CONFIG_FILENAME)
  let userScript

  try {
    userScript = fs.readFileSync(cfgPath, 'utf-8')
  } catch (err) {
    // only a missing config means "keep looking"; anything else is a config
    // the admin wrote and we can't honor
    if (err.code !== 'ENOENT') throw new Error(`${cfgPath}: ${err.message}`)

    log.verbose('No parser config found: %s', dir)

    if (dir === baseDir) {
      log.info('Using default parser config')
      return
    }

    // try parent dir
    return getConfig(path.resolve(dir, '..'), baseDir)
  }

  log.info('Using custom parser config: %s', cfgPath)

  try {
    return JSON5.parse(userScript)
  } catch (err) {
    // Falling back to the parent or default config here would silently re-derive
    // every artist and title in the folder from a format they were never meant
    // to be parsed with. That mints new songs, orphaning the previous ones along
    // with any stars on them, so make a broken config fatal to the scan instead.
    throw new Error(`${cfgPath}: ${err.message}`)
  }
}

export default getConfig
