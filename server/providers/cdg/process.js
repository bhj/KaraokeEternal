const path = require('path')
const debug = require('debug')
const log = debug('app:provider:cdg')

const stat = require('../../lib/thunks/stat')
const hashfiles = require('../../lib/thunks/hashfiles')
const musicmetadata = require('../../lib/thunks/musicmetadata')
const mp3duration = require('../../lib/thunks/mp3duration')

const getLibrary = require('../../lib/getLibrary')
const parseArtistTitle = require('../../lib/parseArtistTitle')

const audioExts = ['.mp3', '.m4a']
let audioExtPerms = []

// uppercase and lowercase combinations of each audio file extension
audioExts.forEach(ext => {
  audioExtPerms = audioExtPerms.concat(getPermutations(ext))
})

async function process (addSong, cdgFile) {
  const cdgPathInfo = path.parse(cdgFile)
  let cdgStats, audioFile, audioPathInfo, sha256, duration

  try {
    // make sure cdg file still exists and get stats
    cdgStats = await stat(cdgFile)

    // already in database with the same path and mtime?
    const res = await getLibrary({
      providerData: {
        path: cdgFile,
        mtime: cdgStats.mtime.getTime() / 1000, // Date to timestamp (s)
      }
    })

    if (res.songs.result.length) {
      log('  => song is in library (same path/mtime)')
      return Promise.resolve(res.songs.result[0])
    }
  } catch (err) {
    return Promise.reject(err)
  }

  // look for a valid audio file
  for (const ext of audioExtPerms) {
    try {
      audioFile = cdgFile.substr(0, cdgFile.length - cdgPathInfo.ext.length) + ext
      await stat(audioFile)

      // found it!
      break
    } catch (err) {
      audioFile = null
    }
  }

  if (!audioFile) {
    return Promise.reject(new Error(`  => no matching audio file found (tried extensions: ${audioExts.join(',')})`))
  }

  audioPathInfo = path.parse(audioFile)
  log('  => found %s audio file', audioPathInfo.ext)

  // hash cdg + audio as a single stream
  log('  => calculating sha256 (.cdg + %s)', audioPathInfo.ext)

  try {
    sha256 = await hashfiles([cdgFile, audioFile], 'sha256')
  } catch (err) {
    return Promise.reject(err)
  }

  // @todo search library for duplicate hashes

  // --------
  // new song
  // --------

  // try getting artist and title from filename
  let song = parseArtistTitle(cdgPathInfo.name)

  if (typeof song !== 'object') {
    // try parent folder?
    log(`  => couldn't parse artist/title from filename; trying parent folder name`)
    song = parseArtistTitle(cdgPathInfo.dir.split(cdgPathInfo.sep).pop())

    if (typeof song !== 'object') {
      return Promise.reject(new Error(`couldn't parse artist/title`))
    }
  }

  log(`  => new song: ${JSON.stringify(song)}`)

  // get duration in one of two ways depending on type
  try {
    if (audioPathInfo.ext.toLowerCase() === '.mp3') {
      log('  => getting duration (mp3duration)')
      duration = await mp3duration(audioFile)
    } else {
      log('  => getting duration (musicmetadata)')
      let musicmeta = await musicmetadata(audioFile, { duration: true })
      duration = musicmeta.duration
    }

    if (!duration) {
      throw new Error('unable to determine duration')
    }
  } catch (err) {
    return Promise.reject(err)
  }

  song.duration = Math.round(duration)
  song.provider = 'cdg'

  song.providerData = {
    path: cdgFile,
    mtime: cdgStats.mtime.getTime() / 1000, // Date to timestamp (s)
    sha256,
  }

  // add song
  try {
    const songId = await addSong(song)
    if (!Number.isInteger(songId)) {
      throw new Error('got invalid lastID')
    }

    return Promise.resolve(songId)
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = process

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
