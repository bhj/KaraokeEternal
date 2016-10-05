const fetch = require('isomorphic-fetch')
var debug = require('debug')
var log = debug('app:provider:youtube')
var error = debug('app:provider:youtube:error')

let seenIds, stats

async function scan(config, ctx) {
  if (typeof config.channel === 'undefined') {
    error('No channels configured; aborting scan')
    return Promise.resolve()
  }

  if (typeof config.key === 'undefined') {
    error(' => no API key configured; aborting scan')
    return Promise.resolve()
  }

  seenIds = []
  stats = {new: 0, moved: 0, ok: 0, removed: 0, skipped: 0, error: 0}

  // make sure we have array of channels
  if (!Array.isArray(config.channel)) config.channel = [config.channel]

  for (let channel of config.channel) {
    let items

    try {
      items = await getPlaylistItems(channel, config.key)
    } catch(err) {
      error('  => %s', err)
    }

    for (let item of items) {
      await process(item, ctx)
    }
  }

  log(JSON.stringify(stats))
  return Promise.resolve()
}


async function process(item, ctx) {
  let videoId = item.snippet.resourceId.videoId
  log('Process [%s]: %s', videoId, item.snippet.title)

  if (seenIds.indexOf(videoId) !== -1) {
    log(' => skipped (videoId already encountered this run)')
    stats.skipped++
    return
  }

  seenIds.push(videoId)

  // search for this file in the db
  let row = await ctx.db.get('SELECT * FROM songs WHERE fingerprint = ?', videoId)

  if (row) {
    // @todo: check mtime and title for updates
    log(' => ok')
    stats.ok++
    return
  }

  let meta = parseArtistTitle(item.snippet.title)

  if (meta === false){
    log(' => skipped (could not parse artist+title)')
    stats.skipped++
    return
  }

  // creating new song
  // does the artist already exist?
  let artist = await ctx.db.get('SELECT * FROM artists WHERE name = ?', meta.artist)

  if (!artist) {
    log(' => new artist: %s', meta.artist)
    let res = await ctx.db.run('INSERT INTO artists(name) VALUES (?)', meta.artist)

    if (!res) {
      error(' => Could not create artist: %s', meta.artist)
      stats.error++
      return
    }

    artist = {id: res.lastID}
  }

  let song = [
    artist.id,  // artistId
    'youtube',  // provider
    meta.title, // title
    '',         // url
    0,          // plays
    videoId     // fingerprint
  ]

  let res = await ctx.db.run('INSERT INTO songs VALUES (?,?,?,?,?,?)', song)
  stats.new++
  log(' => new song: %s - %s', meta.artist, meta.title)
  // console.log({videoId, desc:item.snippet.title, artist: meta.artist, title: meta.title})
}

module.exports = exports = { scan, process }

function parseArtistTitle(str){
  let title, artist
  const phrases = [
    'karaoke video version with lyrics',
    'karaoke version with lyrics',
    'karaoke video with lyrics',
    'karaoke version with lyrics',
    'karaoke video',
    'karaoke version',
    'with lyrics',
    'no lead vocal',
    'singalong',
  ]

  // remove anything after last |
  if (str.lastIndexOf('|') !== -1){
    str = str.substring(0, str.lastIndexOf('|'))
  }

  // remove anything in parantheses
  str = str.replace(/ *\([^)]*\) */g, '')

  // de-"in the style of"
  let delim = str.toLowerCase().indexOf('in the style of')
  if (delim !== -1) {
    let parts = str.split(str.substring(delim, delim+15))
    str = parts[1] + '-' + parts[0]
  }

  // split into song title and artist
  let parts = str.split('-')

  if (parts.length < 2){
    return false
  }

  return { artist : parts[0].trim(), title : parts[1].trim() }
}


async function getPlaylistItems(username, key){
  log('Fetching items by username: %s', username)

  // get channel/playlist info for youtube user
  let url = `https://www.googleapis.com/youtube/v3/channels?forUsername=${username}&key=${key}&part=contentDetails`
  let data = await (await fetch(url)).json()

  if (typeof data.items[0].contentDetails.relatedPlaylists.uploads !== 'string') {
    return Promise.reject('Could not read upload playlist id')
  }

  let playlist = data.items[0].contentDetails.relatedPlaylists.uploads
  url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlist}&key=${key}&maxResults=50&part=snippet`
  data = await (await fetch(url)).json()

  let total = data.pageInfo.totalResults
  let items = data.items
  log(' => %s of %s items', items.length, total)

  while(data.nextPageToken) {
    let pageUrl = url + '&pageToken=' + data.nextPageToken
    data = await (await fetch(pageUrl)).json()
    items = items.concat(data.items)
    log(' => %s of %s items (nextPageToken=%s)', items.length, total, data.nextPageToken)
  }

  return items
}

function titleCase(str) {
  return str.replace(/\w\S*/g, function(tStr) {
    return tStr.charAt(0).toUpperCase() + tStr.substr(1).toLowerCase()
  })
}
