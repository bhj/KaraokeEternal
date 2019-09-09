const path = require('path')
const log = require('../../lib/logger')('FileScanner')
const musicMeta = require('music-metadata')
const getFiles = require('./getFiles')
const getConfig = require('./getConfig')
const getPerms = require('../../lib/getPermutations')
const getCdgName = require('../../lib/getCdgName')
const Library = require('../../Library')
const Media = require('../../Media')
const IPCMedia = require('../IPCMedia')
const MetaParser = require('../MetaParser')
const Scanner = require('../Scanner')

const searchExts = ['mp4', 'm4a', 'mp3']
const searchExtPerms = searchExts.reduce((perms, ext) => perms.concat(getPerms(ext)), [])

class FileScanner extends Scanner {
  constructor (prefs) {
    super()
    this.paths = prefs.paths
  }

  async scan () {
    const files = new Map() // pathId => [files]
    const validMedia = [] // mediaIds
    let count = 0
    let total = 0

    // get list of files from all paths
    for (const pathId of this.paths.result) {
      const basePath = this.paths.entities[pathId].path

      this.emitStatus(`Listing folder ${this.paths.result.indexOf(pathId) + 1} of ${this.paths.result.length}`, 0)
      log.info('Searching path: %s', basePath)

      try {
        const list = await getFiles(basePath, file => searchExtPerms.some(ext => file.endsWith('.' + ext)))
        files.set(pathId, list)
        total += list.length

        log.info('  => found %s files with valid extensions %s', list.length, JSON.stringify(searchExts))
      } catch (err) {
        log.error(`  => ${err.message} (path offline)`)
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    log.info('Processing %s files', total)

    for (const [pathId, list] of files) {
      let lastDir

      for (const item of list) {
        count++
        log.info('[%s/%s] %s', count, total, item.file)
        this.emitStatus(`Scanning media (${count} of ${total})`, (count / total) * 100)

        // (re)init parser with this folder's config, if any
        const dir = path.dirname(item.file)

        if (lastDir !== dir) {
          lastDir = dir

          const cfg = getConfig(dir, this.paths.entities[pathId].path)
          this.parser = new MetaParser(cfg)
        }

        // process file
        try {
          const mediaId = await this.process(item, pathId)

          // success
          validMedia.push(mediaId)
        } catch (err) {
          // try next file
          log.warn(err.message + ': ' + item.file)
        }

        if (this.isCanceling) {
          return
        }
      } // end for
    } // end for

    log.info('Processing finished with %s valid media entries', validMedia.length)

    await this.removeInvalid(validMedia, Array.from(files.keys()))
  }

  async process (item, pathId) {
    const pathInfo = path.parse(item.file)
    const tags = await musicMeta.parseFile(item.file, {
      duration: true,
      skipCovers: true,
    })

    if (!tags.format.duration) {
      throw new Error('  => could not determine duration')
    }

    log.info('  => duration: %s:%s',
      Math.floor(tags.format.duration / 60),
      Math.round(tags.format.duration % 60, 10).toString().padStart(2, '0')
    )

    // run parser
    const parsed = this.parser({
      dir: pathInfo.dir,
      dirSep: path.sep,
      name: pathInfo.name,
      tags: tags.common,
    })

    // get artistId and songId
    const match = await Library.matchSong(parsed)

    const media = {
      songId: match.songId,
      pathId,
      relPath: item.file.substring(this.paths.entities[pathId].path.length),
      duration: Math.round(tags.format.duration),
    }

    // need to look for .cdg if not dealing with a video
    if (!/\.mp4/i.test(path.extname(item.file))) {
      if (!await getCdgName(item.file)) {
        throw new Error('No accompanying .cdg for audio-only file')
      }

      log.info('  => found .cdg file')
    }

    // file already in database?
    const res = await Media.search({
      pathId,
      // try both slashes to be POSIX/Win agnostic
      relPath: [media.relPath.replace('/', '\\'), media.relPath.replace('\\', '/')],
    })

    log.info('  => %s db result(s)', res.result.length)

    if (res.result.length) {
      const row = res.entities[res.result[0]]

      // did songId, player or duration change?
      if (row.songId !== media.songId ||
          row.duration !== media.duration) {
        log.info('  => updated: %s', JSON.stringify(match))

        await IPCMedia.update({
          mediaId: row.mediaId,
          songId: media.songId,
          duration: media.duration,
          dateUpdated: Math.round(new Date().getTime() / 1000), // seconds
        })
      } else {
        log.info('  => ok')
      }

      return row.mediaId
    } // end if

    // new media
    // -------------------------------
    media.dateAdded = Math.round(new Date().getTime() / 1000) // seconds
    log.info('  => new: %s', JSON.stringify(match))

    // resolves to a mediaId
    return IPCMedia.add(media)
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
      await IPCMedia.remove(invalidMedia)
    }

    await IPCMedia.cleanup()
  }
}

module.exports = FileScanner
