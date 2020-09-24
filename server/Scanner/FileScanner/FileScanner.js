const path = require('path')
const log = require('../../lib/Log').getLogger('FileScanner')
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
  MEDIA_CLEANUP,
  MEDIA_REMOVE,
  MEDIA_UPDATE,
} = require('../../../shared/actionTypes')

const searchExts = ['mp4', 'm4a', 'mp3']
const searchExtPerms = searchExts.reduce((perms, ext) => perms.concat(getPerms(ext)), [])

class FileScanner extends Scanner {
  constructor (prefs) {
    super()
    this.paths = prefs.paths
  }

  async scan () {
    const files = new Map() // pathId => [files]
    const valid = [] // mediaIds
    let i = 0 // file counter
    let numTotal = 0
    let numAdded = 0

    // get list of files from all paths
    for (const pathId of this.paths.result) {
      const basePath = this.paths.entities[pathId].path

      this.emitStatus(`Listing folder ${this.paths.result.indexOf(pathId) + 1} of ${this.paths.result.length}`, 0)
      log.info('Searching path: %s', basePath)

      try {
        const list = await getFiles(basePath, file => searchExtPerms.some(ext => file.endsWith('.' + ext)))
        files.set(pathId, list)
        numTotal += list.length

        log.info('  => found %s files with valid extensions %s',
          list.length.toLocaleString(),
          JSON.stringify(searchExts)
        )
      } catch (err) {
        log.error(`  => ${err.message} (path offline)`)
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    log.info('Processing %s files', numTotal.toLocaleString())

    for (const [pathId, list] of files) {
      let lastDir

      for (const item of list) {
        i++
        log.info('[%s/%s] %s', i, numTotal, item.file)
        this.emitStatus(`Scanning media (${i.toLocaleString()} of ${numTotal.toLocaleString()})`, (i / numTotal) * 100)

        const dir = path.dirname(item.file)

        if (lastDir !== dir) {
          lastDir = dir

          // (re)init parser with this folder's config, if any
          const cfg = getConfig(dir, this.paths.entities[pathId].path)
          this.parser = new MetaParser(cfg)
        }

        // process file
        try {
          const res = await this.process(item, pathId)

          // success
          valid.push(res.mediaId)
          if (res.isNew) numAdded++
        } catch (err) {
          log.warn(`  => ${err.message}: ${item.file}`)
        }

        if (this.isCanceling) {
          this.emitStatus(`Stopped (${numAdded} new media)`, 100, false)
          return
        }
      } // end for
    } // end for

    log.info('Processed %s valid media files', valid.length.toLocaleString())

    const numRemoved = await this.removeInvalid(valid, Array.from(files.keys()))

    this.emitStatus(`Finished (${numAdded} new, ${numRemoved} removed, ${valid.length} total media)`, 100, false)

    await IPC.req({ type: MEDIA_CLEANUP })
  }

  async process (item, pathId) {
    const tags = await musicMeta.parseFile(item.file, {
      duration: true,
      skipCovers: true,
    })

    if (!tags.format.duration) {
      throw new Error('could not determine duration')
    }

    log.verbose('  => duration: %s:%s',
      Math.floor(tags.format.duration / 60),
      Math.round(tags.format.duration % 60, 10).toString().padStart(2, '0')
    )

    // run MetaParser
    const pathInfo = path.parse(item.file)
    const parsed = this.parser({
      dir: pathInfo.dir,
      dirSep: path.sep,
      name: pathInfo.name,
      tags: tags.common,
    })

    // get artistId and songId
    const match = await IPC.req({ type: LIBRARY_MATCH_SONG, payload: parsed })

    const media = {
      songId: match.songId,
      pathId,
      // normalize relPath to forward slashes with no leading slash
      relPath: item.file.substring(this.paths.entities[pathId].path.length).replace(/\\/g, '/').replace(/^\//, ''),
      duration: Math.round(tags.format.duration),
      rgTrackGain: tags.common.replaygain_track_gain ? tags.common.replaygain_track_gain.dB : null,
      rgTrackPeak: tags.common.replaygain_track_peak ? tags.common.replaygain_track_peak.ratio : null,
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
    // ---------
    media.dateAdded = Math.round(new Date().getTime() / 1000) // seconds
    log.info('  => new: %s', JSON.stringify(match))

    return {
      mediaId: await IPC.req({ type: MEDIA_ADD, payload: media }),
      isNew: true
    }
  }

  async removeInvalid (validMedia = [], validPaths = []) {
    log.info('Searching for invalid media entries')

    const res = await Media.search()
    const invalidMedia = []

    res.result.forEach(mediaId => {
      // just validated or in an offline path?
      if (validMedia.includes(mediaId) || !validPaths.includes(res.entities[mediaId].pathId)) {
        return
      }

      invalidMedia.push(mediaId)
    })

    log.info(`Found ${invalidMedia.length} invalid media entries`)

    if (invalidMedia.length) {
      await IPC.req({ type: MEDIA_REMOVE, payload: invalidMedia })
    }

    return invalidMedia.length
  }
}

module.exports = FileScanner
