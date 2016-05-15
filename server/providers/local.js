import readdir from '../lib/recursive-readdir'
import multihash from '../lib/multihash'
import fsStat from '../lib/fs-stat'
import path from 'path'

var debug = require('debug')
var log = debug('app:library:local')
var error = debug('app:provider:local:error')

// config
let allowedAudio = ['.mp3', '.m4a', '.flac']
let allowedVideo= ['.mp4', '.m4v']
let allowedExt = allowedAudio.concat(allowedVideo)

let seenHashes, stats, db

export async function scan(config, ctx) {
  if (typeof config.path === 'undefined') {
    error('No paths configured; aborting scan')
    return Promise.resolve()
  }

  db = ctx.db
  seenHashes = []
  stats = {new: 0, moved: 0, ok: 0, removed: 0, error: 0}

  // make sure we have array of paths
  if (!Array.isArray(config.path)) config.path = [config.path]

  for (let searchPath of config.path) {
    let files
    log('Scanning path: %s', searchPath)

    try {
      files = await readdir(searchPath)
    } catch (err) {
      error(err)
      continue
    }

    // filter out files with invalid extensions
    files = files.filter(function(file){
      return allowedExt.some(ext => ext === path.extname(file))
    })
    log('Found %s processable files', files.length)

    for (let file of files) {
      try {
        await process(file)
      } catch(err) {
        error('   => %s', err)
      }
    }

    log(JSON.stringify(stats))
  }

  return Promise.resolve()
}

async function process(file){
  let toHash = [file]
  let info = path.parse(file)
  let meta = parseNameMeta(info) // start with filename-based metadata

  log('Process [#%s]: %s', seenHashes.length, file)

  // if it's audio, does a corresponding CDG file exist?
  if (allowedAudio.indexOf(info.ext) !== -1) {
    try {
      let cdgFile = file.substr(0, file.length-info.ext.length)+'.cdg'
      await fsStat(cdgFile)
      // log(' => CDG file exists')
      toHash.push(cdgFile)
    } catch(err) {
      // log(' => No CDG found')
    }
  }

  // hash the audio and cdg (if present) as one stream
  let hash = await multihash(toHash, 'sha256')
  let desc = toHash.map((ext) => path.extname(ext).replace('.', '')).join('+')
  log(' => %s: %s', desc, hash)

  if (seenHashes.indexOf(hash) !== -1) {
    log(' => skipped (hash already encountered this run)')
    stats.skipped++
    return
  }

  seenHashes.push(hash)

  // search for this file in the db
  let row = await db.get('SELECT * FROM songs WHERE uid = ?', [hash])

  if (row) {
    if (row.url === file) {
      // it's in the same location; we're done
      log(' => already in database')
      stats.ok++
      return
    }

    // it moved! update the location
    await db.run('UPDATE songs SET url = ? WHERE uid = ?', [file, hash])

    stats.moved++
    log(' => moved from: %s', row.url)
    return
  }

  // creating new song
  // does the artist already exist?
  let artist = await db.get('SELECT * FROM artists WHERE artist = ?', [meta.artist])

  if (!artist) {
    log(' => new artist: %s', meta.artist)
    let res = await db.run('INSERT INTO artists(artist) VALUES (?)', [meta.artist])

    if (!res) {
      error(' => Could not create artist: %s', meta.artist)
      stats.error++
      return
    }

    artist = {artist_id: res.lastID}
  }

  let song = [
    artist.artist_id,  // artistId
    'local',    // provider
    meta.title, // title
    file,       // url
    0,          // plays
    hash        // uid
  ]

  let res = await db.run('INSERT INTO songs VALUES (?,?,?,?,?,?)', song)
  // console.log(res)
  stats.new++
  log(' => new song: %s - %s', meta.artist, meta.title)
}

function parseNameMeta(info) {
  let parts

  // are filenames in the format "artist-title"?
  parts = clean(info.name).split('-')
    .map(str => clean(str))
    .filter(str => str) // filter out non-truthy parts

  // right-most part
  let title = titleCase(parts.pop())

  // look to parent directory for artist name if out of parts
  if (!parts.length) {
    let parent = info.dir.split(path.sep).pop()

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
