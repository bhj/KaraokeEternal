const db = require('sqlite')
const readdir = require('../../thunks/recursive-readdir')
const multihash = require('../../thunks/multihash')
const musicmetadata = require('../../thunks/musicmetadata')
const mp3Duration = require('../../thunks/mp3-duration')
const debug = require('debug')
const fs = require('fs')
const fsStat = require('../../thunks/fs-stat')
const pathUtils = require('path')

const log = debug('app:provider:cdg')
const addSong = require('../../library/addSong')
const searchLibrary = require('../../library/search')

let allowedExts = ['.mp3', '.m4a']
let counts

async function scan( cfg) {
  if (!Array.isArray(cfg.paths) || !cfg.paths.length) {
    log('No paths configured; aborting scan')
    return Promise.resolve()
  }

  let validIds = [] // songIds for cleanup
  counts = {ok: 0, new: 0, moved: 0, duplicate: 0, removed: 0, error: 0, skipped: 0}

  for (let searchPath of cfg.paths) {
    let files

    try {
      log('Scanning path: %s', searchPath)
      files = await readdir(searchPath)
      log('  => %s total files', files.length)
    } catch (err) {
      log('  => %s', err)
      continue
    }

    // filter files with invalid extensions
    files = files.filter(function(file){
      return allowedExts.some(ext => ext === pathUtils.extname(file))
    })

    log('  => %s files with valid extensions (%s)', files.length, allowedExts.join(','))

    for (let i=0; i < files.length; i++) {
      try {
        log('[%s/%s] %s', i+1, files.length, files[i])
        let songId = await process(files[i])
        validIds.push(songId)
      } catch(err) {
        log(err.message)
      }
    }

    log(JSON.stringify(counts))
  }

  return Promise.resolve(validIds)
}


async function resource(ctx, cfg) {
  const { type, songId } = ctx.query
  let song, file, stats

  if (! type || ! songId) {
    ctx.status = 422
    return ctx.body = "Missing 'type' or 'songId' in url"
  }

  song = await ctx.db.get('SELECT * FROM songs JOIN songs_cdg USING(songId) WHERE songId = ?', songId)

  if (! song) {
    ctx.status = 404
    return ctx.body = `songId not found: ${songId}`
  }

  if (type === 'audio') {
    file = song.path
    ctx.type = 'audio/mpeg'
  } else if (type === 'cdg') {
    let info = pathUtils.parse(song.path)
    file = song.path.substr(0, song.path.length-info.ext.length)+'.cdg'
  }

  // get file size (and does it exist?)
  try {
    stats = await fsStat(file)
  } catch(err) {
    ctx.status = 404
    return ctx.body = `File not found: ${file}`
  }

  // stream it!
  log('Streaming file: %s', file)

  ctx.length = stats.size
  ctx.body = fs.createReadStream(file)
}

module.exports = { scan, process }


async function process(path){
  const pathInfo = pathUtils.parse(path)
  const cdgPath = path.substr(0, path.length-pathInfo.ext.length)+'.cdg'
  let stats, song, res

  // make sure audio file exists and get stats
  try {
    stats = await fsStat(path)
  } catch(err) {
    log(err)
    counts.error++
    return
  }

  // CDG sidecar must exist too
  try {
    await fsStat(cdgPath)
  } catch(err) {
    log('skipping: no CDG file found')
    counts.skipped++
    return
  }

  // get artist and title
  song = parseMeta(path)
  song.meta = {
    path,
    mtime: stats.mtime.getTime() / 1000, // Date to timestamp (s)
  }

  // already in database with the same path and mtime?
  res = await searchLibrary({meta: {path, mtime: song.meta.mtime}})

  if (res.result.length) {
    log('song is in library (same path+mtime)')
    counts.ok++
    return Promise.resolve(res.result[0])
  }

  // --------
  // new song
  // --------

  // hash the file(s)
  let exts = [path, cdgPath].map(path => pathUtils.parse(path).ext.replace('.', '')).join('+')
  log('getting sha256 (%s)', exts)
  song.meta.sha256 = await multihash([path, cdgPath], 'sha256')

  // get duration in one of two ways depending on type
  try {
    if (pathInfo.ext === '.mp3') {
      log('getting duration (mp3Duration)')
      song.duration = await mp3Duration(path)
    } else {
      log('getting duration (musicmetadata)')
      let musicmeta = await musicmetadata(path, {duration: true})
      song.duration = musicmeta.duration
    }

    if (!song.duration) {
      throw new Error('unable to determine duration')
    }
  } catch(err) {
    log(err.message)
    counts.error++
    return Promise.reject(err)
  }

  song.duration = Math.round(song.duration)
  song.provider = 'cdg'
  let songId

  try {
    songId = await addSong(song)
    if (!Number.isInteger(songId)) {
      throw new Error('got invalid lastID')
    }
  } catch(err) {
    counts.error++
    return Promise.reject(err)
  }

  counts.new++
  return Promise.resolve(songId)
}


function parseMeta(path) {
  const info = pathUtils.parse(path)
  let parts

  // are paths in the format "artist-title"?
  parts = clean(info.name).split('-')
    .map(str => clean(str))
    .filter(str => str) // filter out non-truthy parts

  // right-most part
  let title = titleCase(parts.pop())

  // look to parent directory for artist name if out of parts
  if (!parts.length) {
    let parent = info.dir.split(pathUtils.sep).pop()

    parts = clean(parent).split('-')
    .map(str => clean(str))
    .filter(str => str) // filter out non-truthy parts
  }

  let artist = titleCase(parts.pop())

  return {artist, title}
}

function clean(str) {
  return str.trim()
    // remove leading numbers
    .replace(/^\d/, '')
    // remove text in parantheses or brackets
    .replace(/ *\([^)]*\) */g, '')
    .trim()
}

function titleCase(str) {
  return str.replace(/\w\S*/g, function(tStr) {
    return tStr.charAt(0).toUpperCase() + tStr.substr(1).toLowerCase()
  })
}
