const path = require('path')
const debug = require('debug')
const log = debug('app:media:fileScanner')
const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const musicMeta = require('music-metadata')
const mp4info = require('../../lib/mp4info.js')
const getFiles = require('./getFiles')
const getPerms = require('../../lib/getPermutations')
const Library = require('../../Library')
const Media = require('../Media')
const MetaParser = require('../MetaParser')
const Scanner = require('../Scanner')
const { NodeVM } = require('vm2')

const videoExts = ['.cdg', '.mp4'].reduce((perms, ext) => perms.concat(getPerms(ext)), [])
const audioTypes = ['m4a', 'mp3']

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

      this.emitStatus(`Listing folders (${i + 1} of ${this.paths.result.length})`, 0)

      try {
        log('Searching path: %s', this.paths.entities[pathId].path)
        let list = await getFiles(this.paths.entities[pathId].path)
        list = list.filter(file => videoExts.includes(path.extname(file)))

        log('  => found %s files with valid extensions (cdg, mp4)', list.length)
        files = files.concat(list)
      } catch (err) {
        log(`  => ${err.message} (path offline)`)
        offlinePaths.push(pathId)
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    log('Processing %s total files', files.length)

    // process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const curDir = path.parse(file).dir
      const pathId = this.paths.result.find(pathId =>
        file.indexOf(this.paths.entities[pathId].path) === 0
      )
      const basePath = this.paths.entities[pathId].path

      if (lastDir !== curDir) {
        // (re)init parser with this folder's config, if any
        lastDir = curDir

        const cfg = getCfg(path.dirname(file), basePath)
        this.parser = MetaParser(cfg)
      }

      // emit progress
      log('[%s/%s] %s', i + 1, files.length, file)
      this.emitStatus(`Scanning media (${i + 1} of ${files.length})`, ((i + 1) / files.length) * 100)

      try {
        const mediaId = await this.processFile({ file, pathId, basePath })
        validMedia.push(mediaId) // successfuly processed
      } catch (err) {
        log(err) // try the next file
      }

      if (this.isCanceling) {
        return
      }
    } // end for

    log('Scan finished with %s valid songs', validMedia.length)

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

      if (invalidMedia.length) {
        log(`Removing ${invalidMedia.length} entries for files that no longer exist `)
        await Media.remove(invalidMedia)
      }
    }
  }

  async processFile ({ file, pathId, basePath }) {
    const relPath = file.substr(basePath.length + 1)

    {
      // already in database with the same path?
      const res = await Media.search({
        pathId,
        // try both slashes to be POSIX/Win agnostic
        relPath: [relPath.replace('/', '\\'), relPath.replace('\\', '/')],
      })

      log('  => %s result(s)', res.result.length)

      if (res.result.length) {
        log('  => checking metadata')
        const cur = res.entities[res.result[0]]
        const { artist, title } = this.parser(path.parse(file).name)

        // did artistId or songId change?
        const match = await Library.matchSong(artist, title)

        if (cur.artistId !== match.artistId || cur.songId !== match.songId) {
          log('  => old: %s', JSON.stringify({ artist: cur.artist, title: cur.title }))
          log('  => new: %s', JSON.stringify({ artist: match.artist, title: match.title }))

          await Media.update(cur.mediaId, {
            songId: match.songId,
            dateUpdated: Math.round(new Date().getTime() / 1000), // seconds
          })
        } else {
          log('  => ok')
        }

        return cur.mediaId
      } // end if
    }

    // new media
    // -------------------------------
    const { artist, title } = this.parser(path.parse(file).name)
    const match = await Library.matchSong(artist, title)
    const media = {
      pathId,
      relPath,
      songId: match.songId,
      dateAdded: Math.round(new Date().getTime() / 1000), // seconds
    }

    log('  => new: %s', JSON.stringify({ artist: match.artist, title: match.title }))

    // need to look for an audio file?
    if (path.extname(file).toLowerCase() === '.cdg') {
      let audio

      // look for all uppercase and lowercase permutations of each
      // file extension since we may be on a case-sensitive fs
      for (const type of audioTypes) {
        for (const ext of getPerms(type)) {
          audio = file.substr(0, file.lastIndexOf('.') + 1) + ext

          // does file exist?
          try {
            await stat(audio)
            log('  => found %s audio', type)
            break
          } catch (err) {
            // try another permutation
            audio = null
          }
        } // end for

        if (audio) {
          try {
            const meta = await musicMeta.parseFile(audio, { duration: true })
            media.duration = Math.round(meta.format.duration)
            media.audioExt = path.extname(audio).replace('.', '')
            break
          } catch (err) {
            // try another type
            audio = null
            log(err)
          }
        }
      } // end for

      if (!audio) {
        throw new Error(`  => no valid audio file`)
      }
    } else if (path.extname(file).toLowerCase() === '.mp4') {
      // get video duration
      const info = await mp4info(file)
      media.duration = Math.round(info.duration)
    }

    if (!media.duration) {
      throw new Error(`  => could not determine duration`)
    }

    log('  => duration: %s:%s',
      Math.floor(media.duration / 60),
      Math.round(media.duration % 60, 10).toString().padStart(2, '0')
    )

    // resolves to a mediaId
    return Media.add(media)
  }
}

// search each parent dir (up to baseDir)
function getCfg (dir, baseDir) {
  dir = path.normalize(dir)
  baseDir = path.normalize(baseDir)
  const file = path.resolve(dir, 'kfconfig.js')

  try {
    const userScript = fs.readFileSync(file, 'utf-8')
    log('Found config at %s', file)

    try {
      const vm = new NodeVM({ wrapper: 'none' })
      return vm.run(userScript)
    } catch (err) {
      log(err)
    }
  } catch (err) {
    log('No config at %s', file)
  }

  if (dir === baseDir) {
    return
  }

  // try parent dir
  return getCfg(path.resolve(dir, '..'), baseDir)
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
