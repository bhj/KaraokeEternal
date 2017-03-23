const db = require('sqlite')
const fetch = require('isomorphic-fetch')
var log = require('debug')('app:provider:youtube')
const { parse, toSeconds, pattern } = require('iso8601-duration')

const addSong = require('../../lib/addSong')
const getSongs = require('../../lib/getSongs')

let stats

async function scan(ctx, cfg) {
  const { channels } = cfg

  if (typeof channels === 'undefined' || !Array.isArray(channels)) {
    log('No channels configured; skipping scan')
    return Promise.resolve()
  }

  if (typeof cfg.apiKey === 'undefined') {
    log(' => no API key configured; skipping scan')
    return Promise.resolve()
  }

  let validIds = [] // songIds for cleanup
  stats = {new: 0, moved: 0, ok: 0, removed: 0, skipped: 0, error: 0}

  for (let channel of channels) {
    let items

    try {
      songs = await getPlaylistItems(channel, cfg.apiKey)
    } catch(err) {
      log('  => %s', err)
    }

    for (let song of songs) {
      try {
        let songId = await process(song)
        validIds.push(songId)
      } catch(err) {
        log(err.message)
      }
    }
  }

  log(JSON.stringify(stats))
  return Promise.resolve(validIds)
}


async function process(song) {
  log('processing song: %s', JSON.stringify(song))

  // search for this file in the db
  try {
    let res = await getSongs({meta: { videoId: song.meta.videoId }})
    // @todo: check mtime and title for updates
    if (res.result.length) {
      log('song is in library (same videoId)')
      stats.ok++
      return Promise.resolve(res.result[0])
    }
  } catch(err) {
    log(err.message)
    return Promise.reject(err)
  }

  // new song
  let meta = parseArtistTitle(song.title)

  if (meta === false) {
    stats.skipped++
    return Promise.reject(new Error('could not parse artist/title'))
  }

  song.artist = meta.artist
  song.title = meta.title
  song.provider = 'youtube'

  try {
    let songId = await addSong(song)
    stats.new++
    return Promise.resolve(songId)
  } catch(err) {
    log(err.message)
    stats.error++
    return Promise.reject(err)
  }
}

module.exports = exports = { scan }

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
  let api = getApi(key)
  let playlistId, playlist
  let songs = []

  log('Fetching items by username: %s', username)

  // get channel/playlist info for youtube user
  try {
    let res = await api(`channels?forUsername=${username}&part=contentDetails`)
    playlistId = res.items[0].contentDetails.relatedPlaylists.uploads

    if (typeof playlistId !== 'string') {
      throw new Error('invalid playlist id')
    }
  } catch(err) {
    log(err.message)
    return Promise.reject(err)
  }

  // get playlist page by page
  do {
    let url = `playlistItems?playlistId=${playlistId}&maxResults=50&part=snippet`

    if (playlist && playlist.nextPageToken) {
      url += '&pageToken='+playlist.nextPageToken
    }

    try {
      playlist = await api(url)
    } catch(err) {
      log(err.message)
      return Promise.reject(err)
    }

    // get durations for playlist items
    let videoIds = playlist.items.map(item => item.snippet.resourceId.videoId)
    let details

    try {
      details = await api(`videos?part=contentDetails&id=`+videoIds.join(','))
    } catch(err) {
      log(err.message)
      return Promise.reject(err)
    }

    // build song data
    playlist.items.forEach((item, i) => {
      songs.push({
        title: item.snippet.title,
        duration: toSeconds(parse(details.items[i].contentDetails.duration)),
        meta: {
          username,
          videoId: videoIds[i],
        },
      })
    })

    log('got %s of %s items', songs.length, playlist.pageInfo.totalResults)
  } while (playlist.nextPageToken)

  return songs
}

function titleCase(str) {
  return str.replace(/\w\S*/g, function(tStr) {
    return tStr.charAt(0).toUpperCase() + tStr.substr(1).toLowerCase()
  })
}

function getApi(key) {
  return async function(params) {
    const API = 'https://www.googleapis.com/youtube/v3/'
    const url = API + params + `&key=${key}`
    log('request: %s', API + params.substr(0, params.indexOf('?')))

    try {
      let res = await fetch(url)
      let decoded = await res.json()
      return Promise.resolve(decoded)
    } catch (err) {
      log(err.message)
      return Promise.reject(err)
    }
  }
}
