const fetch = require('isomorphic-fetch')
const log = require('debug')('app:provider:youtube')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api/provider/youtube' })
const { parse, toSeconds } = require('iso8601-duration')

let addSong = require('../../../lib/addSong')
const getLibrary = require('../../../lib/getLibrary')
const getPrefs = require('../../../lib/getPrefs')
const parseArtistTitle = require('../../../lib/parseArtistTitle')

let stats
let isScanning

router.get('/scan', async (ctx, next) => {
  // check jwt validity
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  if (isScanning) {
    ctx.status = 409
    ctx.body = 'Scan already in progress'
    return
  }

  // get preferences
  let cfg

  try {
    cfg = await getPrefs('provider.youtube')

    if (!cfg || !Array.isArray(cfg.channels) || !cfg.channels.length) {
      throw new Error('No channels configured; skipping scan')
    }

    if (typeof cfg.apiKey === 'undefined') {
      throw new Error('no API key configured; skipping scan')
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  isScanning = true
  log('%s started media scan', ctx.user.name)

  // addSong needs ctx so it can broadcast library updates
  addSong = addSong.bind(null, ctx)

  let validIds = [] // songIds for cleanup
  stats = { new: 0, moved: 0, ok: 0, removed: 0, skipped: 0, error: 0 }

  for (let channel of cfg.channels) {
    let items

    try {
      items = await getPlaylistItems(channel, cfg.apiKey)
    } catch (err) {
      log('  => %s', err)
    }

    for (let item of items) {
      try {
        let songId = await process(item)
        validIds.push(songId)
      } catch (err) {
        log(err.message)
      }
    }
  }

  // @todo: song cleanup
  ctx.status = 200
  isScanning = false
  log('finished scan')
  log(JSON.stringify(stats))

  return Promise.resolve()
})

module.exports = router

async function process (item) {
  log('processing: %s', JSON.stringify({
    title: item.snippet.title,
    videoId: item.id,
    duration: item.contentDetails.duration,
  }))

  // is video already in the db?
  try {
    let res = await getLibrary({ providerData: { videoId: item.id } })
    // @todo: check mtime and title for updates
    if (res.songs.result.length) {
      log('song is in library (same videoId)')
      stats.ok++
      return Promise.resolve(res.songs.result[0])
    }
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  // new song
  const { artist, title } = parseArtistTitle(item.snippet.title)

  if (!artist || !title) {
    log(' => skipping: couldn\'t parse artist/title from video title')
    stats.skipped++
    return Promise.reject(new Error('couldn\'t parse artist/title'))
  }

  const song = {
    artist,
    title,
    provider: 'youtube',
    duration: toSeconds(parse(item.contentDetails.duration)),
    providerData: {
      videoId: item.id,
      username: item.username,
      publishedAt: item.snippet.publishedAt,
    }
  }

  try {
    let songId = await addSong(song)
    stats.new++
    return Promise.resolve(songId)
  } catch (err) {
    log(err.message)
    stats.error++
    return Promise.reject(err)
  }
}

// function parseArtistTitle (str) {
//   let title, artist
//   const phrases = [
//     'karaoke video version with lyrics',
//     'karaoke version with lyrics',
//     'karaoke video with lyrics',
//     'karaoke version with lyrics',
//     'karaoke video',
//     'karaoke version',
//     'with lyrics',
//     'no lead vocal',
//     'singalong',
//   ]
//
//   // remove anything after last |
//   if (str.lastIndexOf('|') !== -1) {
//     str = str.substring(0, str.lastIndexOf('|'))
//   }
//
//   // remove anything in parantheses
//   str = str.replace(/ *\([^)]*\) */g, '')
//
//   // de-"in the style of"
//   let delim = str.toLowerCase().indexOf('in the style of')
//   if (delim !== -1) {
//     let parts = str.split(str.substring(delim, delim + 15))
//     str = parts[1] + '-' + parts[0]
//   }
//
//   // split into song title and artist
//   let parts = str.split('-')
//
//   if (parts.length < 2) {
//     return false
//   }
//
//   return { artist : parts[0].trim(), title : parts[1].trim() }
// }

async function getPlaylistItems (username, key) {
  let api = getApi(key)
  let playlistId, playlist
  let items = []

  log('Fetching videos by username: %s', username)

  // get channel/playlist info for youtube user
  try {
    let res = await api(`channels?forUsername=${username}&part=contentDetails`)
    playlistId = res.items[0].contentDetails.relatedPlaylists.uploads

    if (typeof playlistId !== 'string') {
      throw new Error('invalid playlist id')
    }
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  // get playlist page by page
  do {
    let url = `playlistItems?playlistId=${playlistId}&maxResults=50&part=snippet`

    if (playlist && playlist.nextPageToken) {
      url += '&pageToken=' + playlist.nextPageToken
    }

    try {
      playlist = await api(url)
    } catch (err) {
      log(err.message)
      return Promise.reject(err)
    }

    // get durations for playlist items
    let videoIds = playlist.items.map(item => item.snippet.resourceId.videoId)
    let details

    try {
      details = await api(`videos?part=contentDetails&id=` + videoIds.join(','))
    } catch (err) {
      log(err.message)
      return Promise.reject(err)
    }

    // merge snippet and contentDetails data into one
    // object and add it to our final array of items
    playlist.items.forEach((item, i) => {
      items.push(Object.assign({
        username,
      }, playlist.items[i], details.items[i]))
    })

    log('got %s of %s items', items.length, playlist.pageInfo.totalResults)
  } while (playlist.nextPageToken)

  return items
}

function getApi (key) {
  return async function (params) {
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
