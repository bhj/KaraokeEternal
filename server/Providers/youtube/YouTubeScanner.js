const debug = require('debug')
const fetch = require('node-fetch')
const log = debug('app:provider:youtube')
const Scanner = require('../Scanner')
const Media = require('../../Media')
const parseArtistTitle = require('../../lib/parseArtistTitle')
const { parse, toSeconds } = require('iso8601-duration')

class YouTubeScanner extends Scanner {
  constructor (prefs) {
    super()
    this.prefs = prefs
  }

  async run () {
    let validIds = [] // mediaIds for cleanup

    if (!this.prefs.apiKey) {
      throw new Error('Please set your YouTube API key')
    }

    for (const name of this.prefs.channels) {
      let items

      this.emitStatus(`Getting videos by "${name}"`, 0)

      try {
        items = await getPlaylistItems(name, this.prefs.apiKey)
      } catch (err) {
        log('  => %s', err)
      }

      for (const item of items) {
        try {
          const mediaId = await process(item)
          validIds.push(mediaId)
        } catch (err) {
          log(err.message)
        }
      } // end for

      if (this.isCanceling) {
        log('Canceling scan (user requested)')
        break
      }
    } // end for

    return this.emitDone()
  }
}

module.exports = YouTubeScanner

async function process (item) {
  log('processing: %s', JSON.stringify({
    title: item.snippet.title,
    videoId: item.id,
    duration: item.contentDetails.duration,
  }))

  // is video already in the db?
  // try {
  //   let res = await getLibrary({ providerData: { videoId: item.id } })
  //   // @todo: check mtime and title for updates
  //   if (res.songs.result.length) {
  //     log('song is in library (same videoId)')
  //     stats.ok++
  //     return Promise.resolve(res.songs.result[0])
  //   }
  // } catch (err) {
  //   log(err.message)
  //   return Promise.reject(err)
  // }

  // new song
  const { artist, title } = parseArtistTitle(item.snippet.title)

  if (!artist || !title) {
    log(' => skipping: couldn\'t parse artist/title from video title')
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
    const mediaId = await Media.add(song)
    return Promise.resolve(mediaId)
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }
}

async function getPlaylistItems (username, key) {
  let api = getApi(key)
  let playlistId, playlist
  let items = []

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

    if (this.isCanceling) {
      log('Canceling scan (user requested)')
      return this.emitDone()
    }
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
