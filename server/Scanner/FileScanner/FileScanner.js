const path = require('path')
const log = require('../../lib/logger')('FileScanner')
const fs = require('fs')
const musicMeta = require('music-metadata')
const getFiles = require('./getFiles')
const getPerms = require('../../lib/getPermutations')
const getCdgName = require('../../lib/getCdgName')
const Library = require('../../Library')
const Media = require('../../Media')
const IPCMedia = require('../IPCMedia')
const MetaParser = require('../MetaParser')
const Scanner = require('../Scanner')
const { NodeVM } = require('vm2')

const searchExts = ['mp4', 'm4a', 'mp3']
const searchExtPerms = searchExts.reduce((perms, ext) => perms.concat(getPerms(ext)), [])

class FileScanner extends Scanner {
  constructor (prefs) {
    super()
    this.paths = prefs.paths
  }

  async scan () {
    const offlinePaths = [] // pathIds
    const validMedia = [] // mediaIds
    let files = []
    let lastDir

    // count files to scan from all paths
    for (let i = 0; i < this.paths.result.length; i++) {
      const pathId = this.paths.result[i]
      const basePath = this.paths.entities[pathId].path

      this.emitStatus(`Listing folders (${i + 1} of ${this.paths.result.length})`, 0)
      log.info('Searching path: %s', basePath)

      try {
        let list = await getFiles(basePath, { pathId })

        list = list.filter(({ file }) => searchExtPerms.some(ext => file.endsWith('.' + ext)))
        files = files.concat(list)
        log.info('  => found %s files with valid extensions %s', list.length, JSON.stringify(searchExts))
      } catch (err) {
        offlinePaths.push(pathId)
        log.error(`  => ${err.message} (path offline)`)
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    log.info('Processing %s files', files.length)

    // process files
    for (let i = 0; i < files.length; i++) {
      this.emitStatus(`Scanning media (${i + 1} of ${files.length})`, ((i + 1) / files.length) * 100)

      const { file, pathId } = files[i]
      const dir = path.dirname(file)

      if (lastDir !== dir) {
        lastDir = dir

        // (re)init parser with this folder's config, if any
        const cfg = getCfg(dir, this.paths.entities[pathId].path)
        this.parser = new MetaParser(cfg)
      }

      // emit progress
      log.info('[%s/%s] %s', i + 1, files.length, file)

      try {
        const mediaId = await this.processFile(files[i])
        validMedia.push(mediaId) // successfuly processed
      } catch (err) {
        log.warn(err.message + ': ' + file) // try the next file
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    log.info('Scan finished with %s valid media', validMedia.length)

    // cleanup
    {
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
      })

      log.info(`${invalidMedia.length} media unaccounted for in database`)

      if (invalidMedia.length) {
        await IPCMedia.remove(invalidMedia)
      }

      await IPCMedia.cleanup()
    }
  }

  async processFile ({ file, pathId }) {
    const meta = await musicMeta.parseFile(file, {
      duration: true,
      skipCovers: true,
    })

    if (!meta.format.duration) {
      throw new Error(`  => could not determine duration`)
    }

    log.info('  => duration: %s:%s',
      Math.floor(meta.format.duration / 60),
      Math.round(meta.format.duration % 60, 10).toString().padStart(2, '0')
    )

    // run filename parser (MetaParser)
    const parsed = this.parser({
      meta: meta.common,
      file: path.parse(file).name,
    })

    // get artistId and songId
    const match = await Library.matchSong(parsed)

    const media = {
      songId: match.songId,
      pathId,
      relPath: file.substr(this.paths.entities[pathId].path.length + 1),
      duration: Math.round(meta.format.duration),
    }

    // need to look for .cdg if not dealing with a video
    if (!/\.mp4/i.test(path.extname(file))) {
      if (!await getCdgName(file)) {
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
}

// search each parent dir (up to baseDir)
function getCfg (dir, baseDir) {
  dir = path.normalize(dir)
  baseDir = path.normalize(baseDir)
  const file = path.resolve(dir, '_kfconfig.js')

  try {
    const userScript = fs.readFileSync(file, 'utf-8')
    log.info('Using config file %s', file)

    try {
      const vm = new NodeVM({ wrapper: 'none' })
      return vm.run(userScript)
    } catch (err) {
      log.error(err)
    }
  } catch (err) {
    log.info('No config found in folder %s', dir)
  }

  if (dir === baseDir) {
    return
  }

  // try parent dir
  return getCfg(path.resolve(dir, '..'), baseDir)
}

module.exports = FileScanner
