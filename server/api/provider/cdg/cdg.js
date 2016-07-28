import readdir from '../../utilities/recursive-readdir'
import multihash from '../../utilities/multihash'
import musicmetadata from '../../utilities/musicmetadata'
import mp3Duration from '../../utilities/mp3-duration'

import fs from 'fs'
import fsStat from '../../utilities/fs-stat'
import pathUtils from 'path'

var debug = require('debug')
var log = debug('app:library:cdg')
var error = debug('app:library:cdg:error')

let allowedExts = ['.mp3', '.m4a']
let counts
// let seenHashes = []

export async function scan(ctx, cfg) {
  if (!Array.isArray(cfg.paths) || !cfg.paths.length) {
    error('No paths configured; aborting scan')
    return Promise.resolve()
  }

  counts = {ok: 0, new: 0, moved: 0, duplicate: 0, removed: 0, error: 0, skipped: 0}

  for (let searchPath of cfg.paths) {
    let files

    try {
      log('Scanning path: %s', searchPath)
      files = await readdir(searchPath)
      log('  => found %s total files', files.length)
    } catch (err) {
      error('  => %s', err)
      continue
    }

    // filter out files with invalid extensions
    files = files.filter(function(file){
      return allowedExts.some(ext => ext === pathUtils.extname(file))
    })

    log('  => found %s files with valid extensions (%s)', files.length, allowedExts.join(','))

    for (let i=0; i < files.length; i++) {
      try {
        log('[file %s/%s] %s', i+1, files.length, files[i])
        await process(ctx, files[i])
      } catch(err) {
        error(err)
      }
    }

    log(JSON.stringify(counts))
  }

  return Promise.resolve()
}


export async function resource(ctx, cfg) {
  const { type, id } = ctx.query
  let song, file, stats

  if (! type || ! id) {
    ctx.status = 422
    return ctx.body = "Missing 'type' or 'id' query param"
  }

  song = await ctx.db.get('SELECT * FROM songs WHERE id = ?', id)

  if (! song) {
    ctx.status = 404
    return ctx.body = `ID not found: ${id}`
  }

  if (type === 'audio') {
    file = song.path
    ctx.type = 'audio/mpeg'
  } else if (type === 'cdg') {
    let info = pathUtils.parse(song.path)
    file = song.pathUtils.substr(0, song.pathUtils.length-info.ext.length)+'.cdg'
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


async function process(ctx, path){
  const pathInfo = pathUtils.parse(path)
  const cdgPath = path.substr(0, path.length-pathInfo.ext.length)+'.cdg'

  let stats, type, duration

  // make sure file exists and get stats
  try {
    stats = await fsStat(path)
  } catch(err) {
    error(err)
    counts.error++
    return
  }

  // does CDG file exist?
  try {
    await fsStat(cdgPath)
  } catch(err) {
    log('  => skipping: no CDG file found')
    counts.skipped++
    return
  }

  // is it already in the database with the
  // same path and same mtime?
  let row = await ctx.db.get('SELECT * FROM songs_cdg WHERE path = ? AND mtime = ?', path, stats.mtime)

  if (row) {
    log('  => ok')
    counts.ok++
    return
  }

  // hash the files as one
  let hash = await multihash([path, cdgPath], 'sha256')
  let desc = [path, cdgPath].map(path => pathUtils.parse(path).ext.replace('.', '')).join('+')
  log('  => sha256 (%s): %s', desc, hash)

  // search for the hash
  row = await ctx.db.get('SELECT * FROM songs_cdg WHERE hash = ?', hash)

  if (row) {
    // it moved! update the path and mtime
    // @todo handle multiple identical files/hashes better
    await ctx.db.run('UPDATE songs_cdg SET path = ?, mtime = ? WHERE songId = ?',
      [path, stats.mtime, row.songId])

    counts.moved++
    log('  => moved from: %s', row.path)
    return
  }

  // --------
  // new song
  // --------

  // get duration in one of two ways depending on type
  if (pathInfo.ext === '.mp3') {
    try {
      duration = await mp3Duration(path)
    } catch(err) {
      error(err)
      counts.error++
      return
    }
  } else {
    try {
      let musicmeta = await musicmetadata(path, {duration: true})
      duration = musicmeta.duration
    } catch(err) {
      error(err.message)
      counts.error++
      return
    }
  }

  if (!duration) {
    log('  => skipping: unable to determine duration')
    counts.skipped++
    return
  }

  log('  => duration: %s', duration)

  let meta = parseMeta(path)

  // does the artist already exist?
  let artist = await ctx.db.get('SELECT * FROM artists WHERE name = ?', meta.artist)

  if (!artist) {
    log('  => new artist: %s', meta.artist)
    let res = await ctx.db.run('INSERT INTO artists(name) VALUES (?)', meta.artist)

    if (!res) {
      error('  => Could not create artist: %s', meta.artist)
      counts.error++
      return
    }

    artist = {artistId: res.lastID}
  }

  // insert to main library table
  let res = await ctx.db.run('INSERT INTO songs(artistId, provider, title, duration, plays) VALUES (?,?,?,?,?)',
    [artist.artistId, 'cdg', meta.title, duration, 0])

  if (!res) {
    error('  => Could not add song to library (db error)')
    counts.error++
    return
  }

  // insert to provider data table
  res = await ctx.db.run('INSERT INTO songs_cdg(songId, path, mtime, hash) VALUES (?,?,?,?)',
    [res.lastID, path, stats.mtime, hash])

  if (!res) {
    error('  => Could not add song data (db error)')
    counts.error++
    return
  }

  counts.new++
  log('  => new song: %s - %s', meta.artist, meta.title)
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
