const path = require('path')
const debug = require('debug')
const log = debug('app:Providers:FileScanner')
const { promisify } = require('util')
const fs = require('fs')
const stat = promisify(fs.stat)
const mp3duration = promisify(require('mp3-duration'))
const getFiles = require('./lib/getFiles')
const Scanner = require('../Scanner')

const Media = require('../../Media')
const parseArtistTitle = require('../../lib/parseArtistTitle')

const fileExts = ['.cdg', '.mp4', '.m4v']
const audioExts = ['.m4a', '.mp3']

class FileScanner extends Scanner {
  constructor (prefs) {
    super()
    this.paths = prefs.paths || []
  }

  async run () {
    const offlinePaths = []
    const validIds = [] // mediaIds for cleanup
    let files = []

    // emit start
    this.emitStatus('Gathering file list', 0)

    // count files to scan from all paths
    for (const p of this.paths) {
      try {
        log('Searching path: %s', p)
        let list = await getFiles(p)
        list = list.filter(file => fileExts.includes(path.extname(file)))

        log('  => found %s files with valid extensions (%s)', list.length, fileExts.join(', '))
        files = files.concat(list)
      } catch (err) {
        log(`  => ${err.message} (path offline)`)
        offlinePaths.push(p)
      }

      if (this.isCanceling) {
        log('Canceling scan (user requested)')
        return this.emitDone()
      }
    }

    log('Processing %s total files', files.length)

    // process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const basePath = this.paths.find(p => file.indexOf(p) === 0)

      // emit progress
      log('[%s/%s] %s', i + 1, files.length, file)
      this.emitStatus(`Scanning media files (${i + 1} of ${files.length})`, ((i + 1) / files.length) * 100)

      try {
        const mediaId = await this.processFile({ file, basePath })

        // successfuly processed
        validIds.push(mediaId)
      } catch (err) {
        log(err)
        // just try the next file...
      }

      if (this.isCanceling) {
        log('Canceling scan (user requested)')
        return this.emitDone()
      }
    } // end for

    // cleanup: delete songs not in our valid list
    // try {
    //   const q = squel.delete()
    //     .from('songs')
    //     .where('provider IN ?', Object.keys(localProviders))
    //     .where('mediaId NOT IN ?', validIds)
    //     .where(`json_extract(providerData, '$.basePath') IN ?`, prefs.app.paths)
    //
    //   console.log(q.toString())
    //
    //   const { text, values } = q.toParam()
    //   const res = await db.run(text, values)
    //
    //   log('cleanup: removed %s songs', res.stmt.changes)
    // } catch (err) {
    //   log(err.message)
    // }

    console.log('end of run()')
    this.emitDone()
  }

  async processFile ({ file, basePath }) {
    const media = {
      provider: 'file',
      providerData: {
        basePath,
        file: file.substr(basePath.length)
      }
    }

    // already in database with the same path?
    // const res = await Media.get({
    //   provider: 'cdg',
    //   providerData: {
    //     basePath,
    //     relPath: file.substr(basePath.length)
    //   }
    // })

    // console.log(res)

    // calculate current metadata and update db if different
    // (there may be a new parser configuration, for example)
    // if (res.songs.result.length) {
    //   log('  => song is in library (location matched)')
    //   return Promise.resolve(res.songs.result[0])
    // }

    // need to look for an audio file?
    if (path.extname(file).toLowerCase() === '.cdg') {
      let audioFile

      // look for all uppercase and lowercase permutations
      // since we may be on a case-sensitive fs
      for (const ext of audioExts.reduce((perms, ext) => perms.concat(getPermutations(ext)), [])) {
        audioFile = file.substr(0, file.length - path.extname(file).length) + ext

        try {
          await stat(audioFile)

          // success
          log('  => found %s audio file', ext)
          break
        } catch (err) {
          // keep looking
        }
      }

      // get audio duration
      try {
        if (path.extname(audioFile).toLowerCase() === '.mp3') {
          log('  => getting duration (mp3-duration)')
          media.duration = await mp3duration(audioFile)
        }
      } catch (err) {
        log(err)
      }
    } else {
      // @todo: get video duration
    }

    if (!media.duration) {
      return Promise.reject(new Error(`Couldn't determine media duration`))
    }

    // try getting artist and title from filename
    const { artist, title } = parseArtistTitle(path.parse(file).name)

    media.artist = artist
    media.title = title

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
  //   song = parseArtistTitle(cdgPathInfo.dir.split(cdgPathInfo.sep).pop())
  //
  //   if (typeof song !== 'object') {
  //     return Promise.reject(new Error(`couldn't parse artist/title`))
  //   }
  // }

module.exports = FileScanner

// return all uppercase and lowercase permutations of str
// based on https://stackoverflow.com/a/27995370
function getPermutations (str) {
  var results = []
  var arr = str.split('')
  var len = Math.pow(arr.length, 2)

  for (var i = 0; i < len; i++) {
    for (var k = 0, j = i; k < arr.length; k++, j >>= 1) {
      arr[k] = (j & 1) ? arr[k].toUpperCase() : arr[k].toLowerCase()
    }
    var combo = arr.join('')
    results.push(combo)
  }
  // remove duplicates
  return results.filter((ext, pos, self) => self.indexOf(ext) === pos)
}
