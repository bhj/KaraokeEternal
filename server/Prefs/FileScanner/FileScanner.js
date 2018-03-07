const path = require('path')
const debug = require('debug')
const log = debug('app:prefs:fileScanner')
const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const mp3duration = promisify(require('mp3-duration'))
const getFiles = require('./getFiles')
const parseMeta = require('./parseMeta')
const parseMetaCfg = require('./parseMetaCfg')
const getPerms = require('../../lib/getPermutations')
const Scanner = require('../Scanner')
const Media = require('../../Media')

const mediaExts = ['.cdg', '.mp4', '.m4v']
const mediaExtPerms = mediaExts.reduce((perms, ext) => perms.concat(getPerms(ext)), [])

const audioExts = ['.m4a', '.mp3']
const audioExtPerms = audioExts.reduce((perms, ext) => perms.concat(getPerms(ext)), [])

class FileScanner extends Scanner {
  constructor (prefs) {
    super()
    this.paths = prefs.paths
  }

  async scan () {
    const offlinePaths = [] // pathIds
    const validMedia = [] // mediaIds
    let files = []

    // emit start
    this.emitStatus('Gathering file list', 0)

    // count files to scan from all paths
    for (const pathId of this.paths.result) {
      try {
        log('Searching path: %s', this.paths.entities[pathId].path)
        let list = await getFiles(this.paths.entities[pathId].path)
        list = list.filter(file => mediaExtPerms.includes(path.extname(file)))

        log('  => found %s files with valid extensions (%s)', list.length, mediaExts.join(', '))
        files = files.concat(list)
      } catch (err) {
        log(`  => ${err.message} (path offline)`)
        offlinePaths.push(pathId)
      }

      if (this.isCanceling) {
        return
      }
    }

    log('Processing %s total files', files.length)

    // process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const pathId = this.paths.result.find(pathId =>
        file.indexOf(this.paths.entities[pathId].path) === 0
      )

      // emit progress
      log('[%s/%s] %s', i + 1, files.length, file)
      this.emitStatus(`Scanning media files (${i + 1} of ${files.length})`, ((i + 1) / files.length) * 100)

      try {
        const mediaId = await this.processFile({ file, pathId })

        // successfuly processed
        validMedia.push(mediaId)
      } catch (err) {
        log(err)
        // just try the next file...
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    // cleanup
    log('Looking for orphaned media entries')

    try {
      const invalidMedia = []
      const res = await Media.search()

      res.result.forEach(mediaId => {
        // was this media item just verified?
        if (validMedia.includes(mediaId)) {
          return
        }

        // is media item in an offline path?
        if (offlinePaths.includes(res.entities[mediaId].pathId)) {
          return
        }

        // looks like we need to remove it
        invalidMedia.push(mediaId)
        log(`  => ${res.entities[mediaId].file}`)
      })

      log(`Found ${invalidMedia.length} orphaned media entries`)

      if (invalidMedia.length) {
        await Media.remove(invalidMedia)
      }
    } catch (err) {
      log(err)
    }

    // done
  }

  async processFile ({ file, pathId }) {
    let stats
    const media = {
      pathId,
      file,
    }

    try {
      // already in database with the same path?
      const res = await Media.search(media)
      log('  => %s result(s) for existing media', res.result.length)

      if (res.result.length) {
        log('  => found media in library (same path)')
        return Promise.resolve(res.result[0])
      }

      // needs further inspection...
      stats = await stat(file)
    } catch (err) {
      return Promise.reject(err)
    }

    // new media
    // -------------------------------

    // try getting artist and title from filename
    const { artist, title } = parseMeta(path.parse(file).name, parseMetaCfg)

    if (!artist || !title) {
      return Promise.reject(new Error(`Couldn't determine artist or title`))
    }

    media.artist = artist
    media.title = title
    media.timestamp = new Date(stats.mtime).getTime()

    // need to look for an audio file?
    if (path.extname(file).toLowerCase() === '.cdg') {
      // look for all uppercase and lowercase permutations
      // since we may be on a case-sensitive fs
      for (const ext of audioExtPerms) {
        const audioFile = file.substr(0, file.length - path.extname(file).length) + ext

        try {
          await stat(audioFile)

          // success
          log('  => found %s audio file', ext)

          if (ext.toLowerCase() === '.mp3') {
            log('  => getting duration (mp3-duration)')
            media.duration = await mp3duration(audioFile)
          }

          // success
          break
        } catch (err) {
          // keep looking...
        }
      } // end for
    }

    if (!media.duration) {
      return Promise.reject(new Error(`Couldn't determine media duration`))
    }

    // add song
    try {
      const mediaId = await Media.add(media)

      if (!Number.isInteger(mediaId)) {
        throw new Error('got invalid lastID')
      }

      this.emitLibrary()

      return Promise.resolve(mediaId)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

// if (typeof song !== 'object') {
//   // try parent folder?
//   log(`  => couldn't parse artist/title from filename; trying parent folder name`)
//   song = parseMeta(cdgPathInfo.dir.split(cdgPathInfo.sep).pop())
//
//   if (typeof song !== 'object') {
//     return Promise.reject(new Error(`couldn't parse artist/title`))
//   }
// }

module.exports = FileScanner
