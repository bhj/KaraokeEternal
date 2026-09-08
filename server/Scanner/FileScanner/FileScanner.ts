import path from 'path'
import fsPromises from 'node:fs/promises'
import { parseBuffer } from 'music-metadata'
import { unzip } from 'unzipit'
import getLogger from '../../lib/Log.js'
import { getExt } from '../../lib/util.js'
import getFiles from './getFiles.js'
import getConfig from './getConfig.js'
import getCdgName from '../../lib/getCdgName.js'
import { CONFIG_FILENAME, fingerprintsEqual, getMtimeSec, getRelPath, isUnchanged, shouldKeepReplayGain } from './scanUtils.js'
import Media from '../../Media/Media.js'
import MetaParser from '../MetaParser/MetaParser.js'
import Scanner from '../Scanner.js'
import type { ScanStats } from '../Scanner.js'
import IPC from '../../lib/IPCBridge.js'
import fileTypes from '../../Media/fileTypes.js'
import { LIBRARY_MATCH_SONG, MEDIA_ADD, MEDIA_REMOVE, MEDIA_UPDATE, PATH_DATA_SET } from '../../../shared/actionTypes.js'
import type { Path } from '../../../shared/types.js'
const log = getLogger('FileScanner')

const audioExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].mimeType.startsWith('audio/'))
const searchExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].scan !== false)

// "unchanged" is a processed file whose row already matched (e.g. on a
// full scan); it is not tallied since the scan changed nothing for it
type ProcessStatus = 'new' | 'updated' | 'unchanged'

class FileScanner extends Scanner {
  paths: { result: number[], entities: Record<number, Path> }
  parser: ReturnType<typeof MetaParser>

  constructor (prefs, qStats) {
    super(qStats)
    this.paths = prefs.paths
  }

  async scan (pathId, full = false) {
    const dir = this.paths.entities[pathId]?.path
    const validMediaIds = new Set<number>()
    const stats: ScanStats = { new: 0, updated: 0, removed: 0 }
    let files // { file, stats }[]
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

        // process file
        try {
          const res = await this.process(files[i], pathId, { relPath, row })
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
    } // end for

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

  async process ({ file, mtimeMs }, pathId, { relPath, row }): Promise<{ mediaId: number, status: ProcessStatus }> {
    const mtimeSec = getMtimeSec(mtimeMs)
    let buffer = await fsPromises.readFile(file)
    let mimeType = fileTypes[getExt(file)].mimeType

    if (getExt(file) === '.zip') {
      const { entries } = await unzip(new Uint8Array(buffer))

      const audioName = Object.keys(entries).find(f => !f.includes('/') && audioExts.includes(getExt(f)))
      if (!audioName) throw new Error(`no valid audio file ${JSON.stringify(audioExts)} found in archive`)

      const cdgName = Object.keys(entries).find(f => !f.includes('/') && getExt(f) === '.cdg')
      if (!cdgName) throw new Error('no .cdg sidecar found in archive')

      buffer = Buffer.from(await entries[audioName].arrayBuffer())
      mimeType = fileTypes[getExt(audioName)].mimeType
    } else {
      if (fileTypes[getExt(file)].requiresCDG && !(getCdgName(file))) throw new Error('no .cdg sidecar found')
    }

    const data = await parseBuffer(buffer, mimeType, {
      duration: true,
      skipCovers: true,
    })

    if (!data.format.duration) {
      throw new Error('could not determine duration')
    }

    log.verbose('  => duration: %s:%s',
      Math.floor(data.format.duration / 60),
      Math.round(data.format.duration % 60).toString().padStart(2, '0'),
    )

    // run MetaParser
    const pathInfo = path.parse(file)
    const parsed = this.parser({
      dir: pathInfo.dir,
      dirSep: path.sep,
      name: pathInfo.name,
      meta: data.common,
    })

    // get artistId and songId
    const match = await IPC.req({ type: LIBRARY_MATCH_SONG, payload: parsed }) as { songId: number }

    const media = {
      songId: match.songId,
      pathId,
      relPath,
      duration: Math.round(data.format.duration),
      rgTrackGain: data.common.replaygain_track_gain ? data.common.replaygain_track_gain.dB : null,
      rgTrackPeak: data.common.replaygain_track_peak ? data.common.replaygain_track_peak.ratio : null,
    }

    // file already in database?
    if (row) {
      const diff = {}

      // did anything change?
      Object.keys(media).forEach((key) => {
        // An unchanged file normally skips processing entirely, so this mainly
        // covers a full rescan, which bypasses the skip; without it every full
        // rescan would discard client-calculated values for the whole library.
        if ((key === 'rgTrackGain' || key === 'rgTrackPeak')
          && shouldKeepReplayGain(media[key], row[key], mtimeSec, row.dateUpdated)) {
          return
        }

        if (media[key] !== row[key]) diff[key] = media[key]
      })

      const isChanged = Object.keys(diff).length > 0

      // dateUpdated stores the file's mtime; sync it even when content is
      // unchanged so the file can be skipped next scan
      if (isChanged || row.dateUpdated !== mtimeSec) {
        await IPC.req({
          type: MEDIA_UPDATE,
          payload: {
            mediaId: row.mediaId,
            dateUpdated: mtimeSec,
            ...diff,
          },
        })

        log.info('  => updated: %s', Object.keys(diff).join(', ') || 'dateUpdated')
      } else {
        log.info('  => ok')
      }

      // a dateUpdated-only sync is bookkeeping, not a change to the media entry
      return { mediaId: row.mediaId, status: isChanged ? 'updated' : 'unchanged' }
    } // end if

    // new media
    const mediaWithDate = {
      ...media,
      dateAdded: Math.round(new Date().getTime() / 1000), // seconds
      dateUpdated: mtimeSec,
    }
    log.info('  => new: %s', JSON.stringify(match))

    return {
      mediaId: await IPC.req({ type: MEDIA_ADD, payload: mediaWithDate }) as number,
      status: 'new',
    }
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

export default FileScanner
