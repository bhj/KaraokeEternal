import path from 'path'
import fsPromises from 'node:fs/promises'
import musicMeta from 'music-metadata'
import { unzip } from 'unzipit'
import getLogger from '../../lib/Log.js'
import { getExt } from '../../lib/util.js'
import getFiles from './getFiles.js'
import getConfig from './getConfig.js'
import getCdgName from '../../lib/getCdgName.js'
import Media from '../../Media/Media.js'
import MetaParser from '../MetaParser/MetaParser.js'
import Scanner from '../Scanner.js'
import IPC from '../../lib/IPCBridge.js'
import fileTypes from '../../Media/fileTypes.js'
import { LIBRARY_MATCH_SONG, MEDIA_ADD, MEDIA_REMOVE, MEDIA_UPDATE } from '../../../shared/actionTypes.js'
const log = getLogger('FileScanner')

const audioExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].mimeType.startsWith('audio/'))
const searchExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].scan !== false)

class FileScanner extends Scanner {
  constructor (prefs, qStats) {
    super(qStats)
    this.paths = prefs.paths
  }

  async scan (pathId) {
    const dir = this.paths.entities[pathId]?.path
    const validMediaIds = []
    let files // { file, stats }[]
    let prevDir

    if (!dir) {
      log.error('invalid pathId: %s', pathId)
      return
    }

    log.info('Searching: %s', dir)
    this.emitStatus(`Searching: ${dir}`, 0)

    try {
      files = await getFiles(dir, file => searchExts.includes(getExt(file)))

      log.info('  => found %s files with valid extensions %s',
        files.length.toLocaleString(),
        JSON.stringify(searchExts)
      )
    } catch (err) {
      log.error(`  => ${err.message} (path offline)`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const curDir = path.dirname(files[i].file)

      if (prevDir !== curDir) {
        prevDir = curDir

        // (re)init parser with this folder's config, if any
        const cfg = getConfig(curDir, dir)
        this.parser = new MetaParser(cfg)
      }

      log.info('[%s/%s] %s', i + 1, files.length, files[i].file)
      this.emitStatus(`Processing (${i + 1} of ${files.length})`, (i + 1) / files.length)

      // process file
      try {
        const res = await this.process(files[i], pathId)
        validMediaIds.push(res.mediaId)
      } catch (err) {
        log.warn(`  => ${err.message}`)
      }

      if (this.isCanceling) {
        this.emitStatus('Stopped', 100, false)
        return
      }
    } // end for

    log.info('Processed %s valid media files', validMediaIds.length.toLocaleString())
    log.info('Searching for invalid media entries')

    const numRemoved = await this.removeInvalid(pathId, validMediaIds)
    log.info(`Removed ${numRemoved} invalid media entries`)
  }

  async process ({ file }, pathId) {
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
      if (fileTypes[getExt(file)].requiresCDG && !(await getCdgName(file))) throw new Error('no .cdg sidecar found')
    }

    const data = await musicMeta.parseBuffer(buffer, mimeType, {
      duration: true,
      skipCovers: true,
    })

    if (!data.format.duration) {
      throw new Error('could not determine duration')
    }

    log.verbose('  => duration: %s:%s',
      Math.floor(data.format.duration / 60),
      Math.round(data.format.duration % 60, 10).toString().padStart(2, '0')
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
    const match = await IPC.req({ type: LIBRARY_MATCH_SONG, payload: parsed })

    const media = {
      songId: match.songId,
      pathId,
      // normalize relPath to forward slashes with no leading slash
      relPath: file.substring(this.paths.entities[pathId].path.length).replace(/\\/g, '/').replace(/^\//, ''),
      duration: Math.round(data.format.duration),
      rgTrackGain: data.common.replaygain_track_gain ? data.common.replaygain_track_gain.dB : null,
      rgTrackPeak: data.common.replaygain_track_peak ? data.common.replaygain_track_peak.ratio : null,
    }

    // file already in database?
    const res = await Media.search({
      pathId,
      relPath: media.relPath,
    })

    log.verbose('  => %s db result(s)', res.result.length)

    if (res.result.length) {
      const row = res.entities[res.result[0]]
      const diff = {}

      // did anything change?
      Object.keys(media).forEach(key => {
        if (media[key] !== row[key]) diff[key] = media[key]
      })

      if (Object.keys(diff).length) {
        await IPC.req({
          type: MEDIA_UPDATE,
          payload: {
            mediaId: row.mediaId,
            dateUpdated: Math.round(new Date().getTime() / 1000), // seconds
            ...diff,
          }
        })

        log.info('  => updated: %s', Object.keys(diff).join(', '))
      } else {
        log.info('  => ok')
      }

      return { mediaId: row.mediaId, isNew: false }
    } // end if

    // new media
    media.dateAdded = Math.round(new Date().getTime() / 1000) // seconds
    log.info('  => new: %s', JSON.stringify(match))

    return {
      mediaId: await IPC.req({ type: MEDIA_ADD, payload: media }),
      isNew: true
    }
  }

  async removeInvalid (pathId, validMediaIds = []) {
    const res = await Media.search({ pathId })
    const invalid = res.result.filter(mediaId => !validMediaIds.includes(mediaId))

    if (invalid.length) {
      await IPC.req({ type: MEDIA_REMOVE, payload: invalid })
    }

    return invalid.length
  }
}

export default FileScanner
