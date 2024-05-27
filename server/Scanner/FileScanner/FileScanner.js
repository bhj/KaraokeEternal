const path = require('path')
const log = require('../../lib/Log')('FileScanner')
const musicMeta = require('music-metadata')
const getFiles = require('./getFiles')
const getConfig = require('./getConfig')
const getPerms = require('../../lib/getPermutations')
const getCdgName = require('../../lib/getCdgName')
const Media = require('../../Media')
const MetaParser = require('../MetaParser')
const Scanner = require('../Scanner')
const IPC = require('../../lib/IPCBridge')
const {
  LIBRARY_MATCH_SONG,
  MEDIA_ADD,
  MEDIA_REMOVE,
  MEDIA_UPDATE,
} = require('../../../shared/actionTypes')

const searchExts = ['mp4', 'm4a', 'mp3']
const searchExtPerms = searchExts.reduce((perms, ext) => perms.concat(getPerms(ext)), [])

class FileScanner extends Scanner {
  constructor (prefs, qStats) {
    super(qStats)
    this.paths = prefs.paths
  }

  async scan (pathId) {
    const dir = this.paths.entities[pathId]?.path

    if (!dir) {
      log.error('invalid pathId: %s', pathId)
      return
    }

    const validMediaIds = []
    let files // { file, stats }[]

    log.info('Searching: %s', dir)
    this.emitStatus(`Searching: ${dir}`, 0)

    try {
      files = await getFiles(dir, f => searchExtPerms.some(ext => f.endsWith('.' + ext)))

      log.info('  => found %s files with valid extensions (%s)',
        files.length.toLocaleString(),
        JSON.stringify(searchExts)
      )
    } catch (err) {
      log.error(`  => ${err.message} (path offline)`)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const curDir = path.dirname(files[i].file)
      let prevDir

      log.info('[%s/%s] %s', i + 1, files.length, files[i].file)

      this.emitStatus(`Processing (${i + 1} of ${files.length})`, (i + 1) / files.length)
      if (prevDir !== curDir) {
        prevDir = curDir

        // (re)init parser with this folder's config, if any
        const cfg = getConfig(curDir, dir)
        this.parser = new MetaParser(cfg)
      }

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

  async process (item, pathId) {
    const data = await musicMeta.parseFile(item.file, {
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
    const pathInfo = path.parse(item.file)
    const parsed = this.parser({
      dir: pathInfo.dir,
      dirSep: path.sep,
      name: pathInfo.name,
      data: data.common,
    })

    // get artistId and songId
    const match = await IPC.req({ type: LIBRARY_MATCH_SONG, payload: parsed })

    const media = {
      songId: match.songId,
      pathId,
      // normalize relPath to forward slashes with no leading slash
      relPath: item.file.substring(this.paths.entities[pathId].path.length).replace(/\\/g, '/').replace(/^\//, ''),
      duration: Math.round(data.format.duration),
      rgTrackGain: data.common.replaygain_track_gain ? data.common.replaygain_track_gain.dB : null,
      rgTrackPeak: data.common.replaygain_track_peak ? data.common.replaygain_track_peak.ratio : null,
    }

    // need to look for .cdg if this is an audio-only file
    if (!/\.mp4/i.test(path.extname(item.file))) {
      if (!await getCdgName(item.file)) {
        throw new Error('no .cdg sidecar found; skipping')
      }

      log.verbose('  => found .cdg sidecar')
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

module.exports = FileScanner
