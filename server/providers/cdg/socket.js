const path = require('path')
const debug = require('debug')
const log = debug('app:provider:cdg')

const getFiles = require('../../lib/thunks/getFiles')
const hashfiles = require('../../lib/thunks/hashfiles')
const musicmetadata = require('../../lib/thunks/musicmetadata')
const mp3duration = require('../../lib/thunks/mp3duration')
const stat = require('../../lib/thunks/stat')

const addSong = require('../../lib/addSong')
const getLibrary = require('../../lib/getLibrary')
const getPrefs = require('../../lib/getPrefs')
const getSongs = require('../../lib/getSongs')
const parseArtistTitle = require('../../lib/parseArtistTitle')

const {
  REQUEST_PROVIDER_SCAN,
  LIBRARY_UPDATE,
  _ERROR,
} = require('../../api/constants')

const allowedExts = ['.mp3', '.m4a']
let isScanning, counts

const ACTION_HANDLERS = {
  [REQUEST_PROVIDER_SCAN]: async (ctx, action) => {
    const { type, payload } = action
    let cfg

    if (payload !== 'cdg') {
      log(`ignoring scan request for provider: ${payload}`)
      return
    }

    if (isScanning) {
      return ctx.acknowledge({
        type: type + _ERROR,
        meta: {
          error: `Scan already in progress`
        }
      })
    }

    // get preferences
    try {
      cfg = await getPrefs('provider.cdg')
      if (!typeof cfg === 'object' || !Array.isArray(cfg.paths)) {
        throw new Error('No paths configured; aborting scan')
      }
    } catch (err) {
      return ctx.acknowledge({
        type: type + _ERROR,
        meta: {
          error: err.message,
        }
      })
    }

    isScanning = true
    log('starting scan')

    let validIds = [] // songIds for cleanup
    counts = { new: 0, ok: 0, skipped: 0 }

    for (const dir of cfg.paths) {
      let files = []

      // get list of files
      try {
        log('searching path: %s', dir)
        files = await getFiles(dir, file => allowedExts.includes(path.extname(file).toLowerCase()))
        log('found %s files with valid extensions (%s)', files.length, allowedExts.join(','))
      } catch (err) {
        // try next configured path
        log(err.message)
        continue
      }

      for (let i = 0; i < files.length; i++) {
        log('[%s/%s] %s', i + 1, files.length, files[i])
        let songId, newCount

        try {
          songId = await process(files[i])
        } catch (err) {
          // try next file
          log(err.message)
          continue
        }

        validIds.push(songId)

        if (counts.new !== newCount) {
          newCount = counts.new
          // emit updated library
          ctx.io.emit('action', {
            type: LIBRARY_UPDATE,
            payload: await getLibrary(),
          })
        }

        // emit progress
        // ctx.io.emit('action', {
        //   type: PROVIDER_SCAN_STATUS,
        //   payload: {provider: 'cdg', pct: (files.length/i) * 100},
        // })
      }
    } // end for loop

    // // delete songs not in our valid list
    // let res = await db.run('DELETE FROM songs WHERE provider = ? AND songId NOT IN ('+validIds.join(',')+')', payload)
    // log('cleanup: removed %s invalid songs', res.stmt.changes)
    //

    isScanning = false

    return Promise.resolve()
  },
}

module.exports = ACTION_HANDLERS

async function process (file) {
  const pathInfo = path.parse(file)
  let stats, sha256, duration

  // does file exist?
  try {
    stats = await stat(file)
  } catch (err) {
    log('skipping: %s', err.message)
    counts.skipped++
    return Promise.reject(err)
  }

  // already in database with the same path and mtime?
  try {
    const res = await getSongs({
      providerData: {
        path: file,
        mtime: stats.mtime.getTime() / 1000, // Date to timestamp (s)
      }
    })

    if (res.result.length) {
      log('song is in library (same path/mtime)')
      counts.ok++
      return Promise.resolve(res.result[0])
    }
  } catch (err) {
    log('skipping: %s', err.message)
    counts.skipped++
    return Promise.reject(err)
  }

  // need to hash the file(s)
  // (don't bother if CDG sidecar doesn't exist)
  const cdgFile = file.substr(0, file.length - pathInfo.ext.length) + '.cdg'

  try {
    await stat(cdgFile)
  } catch (err) {
    log('skipping: %s', err.message)
    counts.skipped++
    return Promise.reject(err)
  }

  log('getting sha256 (%s)', pathInfo.ext + '+.cdg')

  try {
    sha256 = await hashfiles([file, cdgFile], 'sha256')
  } catch (err) {
    log('skipping: %s', err.message)
    counts.skipped++
    return Promise.reject(err)
  }

  // --------
  // new song
  // --------

  // try getting artist and title from filename
  let song = parseArtistTitle(pathInfo.name)

  if (typeof song !== 'object') {
    log('couldn\'t parse artist/title from filename (%s); trying parent folder', song)

    // try parent folder?
    song = parseArtistTitle(pathInfo.dir.split(pathInfo.sep).pop())

    if (typeof song !== 'object') {
      log('couldn\'t parse artist/title from folder: %s', song)
      counts.skipped++
      return Promise.reject(new Error('couldn\'t parse artist/title'))
    }
  }

  // get duration in one of two ways depending on type
  try {
    if (pathInfo.ext === '.mp3') {
      log('getting duration (mp3duration)')
      duration = await mp3duration(file)
    } else {
      log('getting duration (musicmetadata)')
      let musicmeta = await musicmetadata(file, { duration: true })
      duration = musicmeta.duration
    }

    if (!duration) {
      throw new Error('unable to determine duration')
    }
  } catch (err) {
    log(err.message)
    counts.skipped++
    return Promise.reject(err)
  }

  song.duration = Math.round(duration)
  song.provider = 'cdg'

  song.providerData = {
    path: file,
    mtime: stats.mtime.getTime() / 1000, // Date to timestamp (s)
    sha256,
  }

  // add song
  try {
    const songId = await addSong(song)
    if (!Number.isInteger(songId)) {
      throw new Error('got invalid lastID')
    }

    counts.new++
    return Promise.resolve(songId)
  } catch (err) {
    counts.skipped++
    return Promise.reject(err)
  }
}
