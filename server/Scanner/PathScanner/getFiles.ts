import fs from 'fs'
import path from 'path'
import getLogger from '../../lib/Log.js'
const log = getLogger('PathScanner:getFiles')

/**
 * Directory walker that only throws if parent directory
 * can't be read. Errors stat-ing children are only logged.
 *
 * @param dir path to recursively list
 * @param filterFn filter function applied to each file
 * @return array of objects with path and mtime properties
 */
function getFiles (dir: string, filterFn?: (file: string) => boolean): { file: string, mtimeMs: number }[] {
  let results: { file: string, mtimeMs: number }[] = []
  const list = fs.readdirSync(dir)

  list.forEach((file) => {
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
        results = results.concat(getFiles(file, filterFn))
      } catch (err) {
        log.warn(err.message)
      }
    } else {
      if (!filterFn || filterFn(file)) {
        // keep only the mtime; a retained fs.Stats per file carries four Date
        // objects, which adds up over a large library
        results.push({ file, mtimeMs: stats.mtimeMs })
      }
    }
  })

  return results
}

export default getFiles
