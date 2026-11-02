import path from 'path'
import getLogger from '../../lib/Log.js'
import { getExt } from '../../lib/util.js'
import getFiles from './getFiles.js'
import getConfig from './getConfig.js'
import getCdgName from '../../lib/getCdgName.js'
import { CONFIG_FILENAME, fingerprintsEqual, getMtimeSec, getRelPath, isUnchanged } from '../scanUtils.js'
import MetaParser from '../MetaParser/MetaParser.js'
import Scanner from '../Scanner.js'
import FileScanner from '../FileScanner.js'
import type { ScanStats } from '../Scanner.js'
import IPC from '../../lib/IPCBridge.js'
import Media from '../../Media/Media.js'
import fileTypes from '../../Media/fileTypes.js'
import { MEDIA_REMOVE, PATH_DATA_SET } from '../../../shared/actionTypes.js'
import type { Path } from '../../../shared/types.js'

const log = getLogger('PathScanner')

const searchExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].scan !== false)

class PathScanner extends Scanner {
  paths: { result: number[], entities: Record<number, Path> }
  parser: ReturnType<typeof MetaParser>
  fileScanner: FileScanner

  constructor (prefs, qStats) {
    super(qStats)
    this.paths = prefs.paths
    this.fileScanner = new FileScanner(prefs)
  }

  async scan (pathId, full = false) {
    const dir = this.paths.entities[pathId]?.path
    const validMediaIds = new Set<number>()
    const stats: ScanStats = { new: 0, updated: 0, removed: 0 }
    let files
    let prevDir

    if (!dir) {
      log.error('invalid pathId: %s', pathId)
      return stats
    }

    if (!full && this.paths.entities[pathId].prefs?.scanFull) {
      log.info('scanFull pref enabled; ignoring stored file dates for this scan')
      full = true
    }

    log.info('Searching: %s', dir)
    this.emitStatus(`Searching: ${dir}`, 0)

    try {
      files = getFiles(dir, file => searchExts.includes(getExt(file))
        || path.basename(file).toLowerCase() === CONFIG_FILENAME)
    } catch (err) {
      log.error(`  => ${err.message} (path offline)`)
      return stats
    }

    // separate parser configs from media files and fingerprint them
    const configs: Record<string, number> = {}

    files = files.filter((f) => {
      if (path.basename(f.file).toLowerCase() !== CONFIG_FILENAME) return true
      configs[getRelPath(dir, f.file)] = getMtimeSec(f.mtimeMs)
      return false
    })

    log.info('  => found %s files with valid extensions %s',
      files.length.toLocaleString(),
      JSON.stringify(searchExts),
    )

    // a parser config change means unchanged files could parse differently
    const configsChanged = !fingerprintsEqual(configs, this.paths.entities[pathId].scanner?.configs ?? {})

    if (configsChanged && !full) {
      log.info('parser config change detected; ignoring stored file dates for this scan')
      full = true
    }

    // load this path's media once; it's held for the duration of the scan
    const { mediaIds, byRelPath } = Media.getPathIndex(pathId)

    for (let i = 0; i < files.length; i++) {
      const curDir = path.dirname(files[i].file)
      const relPath = getRelPath(dir, files[i].file)
      const row = byRelPath.get(relPath)

      const skip = row && isUnchanged(row, getMtimeSec(files[i].mtimeMs), {
        full,
        requiresCDG: !!fileTypes[getExt(files[i].file)].requiresCDG,
        cdgExists: () => !!getCdgName(files[i].file),
      })

      log.info('[%s/%s] %s', i + 1, files.length, files[i].file)

      if (skip) {
        validMediaIds.add(row.mediaId)
        log.verbose('  => unchanged (skipped)')

        // skipped iterations are cheap; don't emit one IPC status message per file
        if ((i + 1) % 50 === 0 || i + 1 === files.length) {
          this.emitStatus(`Scanning (${i + 1} of ${files.length})`, (i + 1) / files.length)
        }
      } else {
        if (prevDir !== curDir) {
          // (re)init parser with this folder's config, if any
          let cfg

          try {
            cfg = getConfig(curDir, dir)
          } catch (err) {
            // returning here also leaves removeInvalid and the config
            // fingerprint alone, so the scan can simply be run again
            log.error(`  => ${err.message}`)
            log.error('Aborting scan of %s (fix the parser config, then scan again)', dir)
            return stats
          }

          prevDir = curDir
          this.parser = MetaParser(cfg)
        }

        this.emitStatus(`Scanning (${i + 1} of ${files.length})`, (i + 1) / files.length)

        try {
          const res = await this.fileScanner.process(files[i].file, pathId, this.parser, {
            relPath,
            row,
            mtimeMs: files[i].mtimeMs,
          })
          validMediaIds.add(res.mediaId)
          if (res.status !== 'unchanged') stats[res.status]++
        } catch (err) {
          log.warn(`  => ${err.message}`)
        }
      }

      if (this.isCanceling) {
        this.emitStatus('Stopped', 100, false)
        return stats
      }
    }

    log.info('Scanned %s valid media files', validMediaIds.size.toLocaleString())
    log.info('Searching for invalid media entries')

    const numRemoved = await this.removeInvalid(mediaIds, validMediaIds)
    stats.removed = numRemoved
    log.info(`Removed ${numRemoved} invalid media entries`)

    // remember current parser configs only after a completed scan; a canceled
    // scan keeps the old fingerprint so the change is re-detected next time
    if (configsChanged) {
      await IPC.req({
        type: PATH_DATA_SET,
        payload: { pathId, data: { scanner: { configs } } },
      })
    }

    return stats
  }

  /**
   * Removes media rows whose file is no longer in the path
   *
   * @param mediaIds - every mediaId the path had when this scan started. Rows
   *   added during the scan are necessarily valid, so omitting them is safe.
   * @param validMediaIds - mediaIds processed or skipped during this scan
   */
  async removeInvalid (mediaIds: number[], validMediaIds: Set<number>) {
    const invalid = mediaIds.filter(mediaId => !validMediaIds.has(mediaId))

    if (invalid.length) {
      await IPC.req({ type: MEDIA_REMOVE, payload: invalid })
    }

    return invalid.length
  }
}

export default PathScanner
