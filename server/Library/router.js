const db = require('../lib/Database').db
const sql = require('sqlate')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const Media = require('../Media')
const Prefs = require('../Prefs')
const DateTime = require('../lib/DateTime')
const ytsr = require('ytsr')
const getArtistTitle = require('get-artist-title')
const Genius = require('genius-lyrics')

// lists underlying media for a given song
router.get('/song/:songId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.throw(401)
  }

  const songId = parseInt(ctx.params.songId, 10)

  if (Number.isNaN(songId)) {
    ctx.throw(401, 'Invalid songId')
  }

  const res = await Media.search({ songId })

  if (!res.result.length) {
    ctx.throw(404)
  }

  ctx.body = res
})

// searches YouTube for videos
router.post('/youtubesearch', async (ctx, next) => {
  const prefs = await Prefs.get()

  const containsKaraoke = ctx.request.body.toLowerCase().includes('karaoke')
  const queries = []

  // add the query as-is...
  if (prefs.isKaraokeGeneratorEnabled || containsKaraoke) {
    queries.push(ctx.request.body)
  }

  // add a query with "karaoke" added...
  if (!containsKaraoke) {
    queries.push(ctx.request.body + ' karaoke')
  }

  // add a query with "karaoke" removed...
  if (prefs.isKaraokeGeneratorEnabled && containsKaraoke) {
    queries.push(ctx.request.body.replace(/karaoke/gi, ''))
  }

  const filterPromises = queries.map(query => {
    return ytsr.getFilters(query)
  })

  const filterResults = await Promise.all(filterPromises)

  const searchPromises = filterResults.map(filters => {
    return ytsr(filters.get('Type').get('Video').url, {
      limit: 20,
    })
  })

  const searchResults = await Promise.all(searchPromises)

  // get videos queued in this room so we can determine which videos are queued...
  const query = sql`
    SELECT youtubeVideoId
    FROM queue
    WHERE youtubeVideoId IS NOT NULL AND roomId = ${ctx.user.roomId}
  `
  const rows = await db.all(String(query), query.parameters)
  const queuedVideoIds = rows.map(row => row.youtubeVideoId)

  const cleanResults = searchResults.map(searchResult => {
    return searchResult.items.filter((video) => {
      const karaokeSearched = searchResult.originalQuery.toLowerCase().includes('karaoke')
      const karaokeFound = video.title.toLowerCase().includes('karaoke')
      return (video.author && video.bestThumbnail && DateTime.durationToSeconds(video.duration) < 600 && karaokeSearched === karaokeFound)
    }).map((video) => {
      return {
        id: video.id,
        url: video.url,
        title: video.title,
        duration: video.duration,
        thumbnail: video.bestThumbnail.url,
        channel: video.author.name,
        karaoke: video.title.toLowerCase().includes('karaoke'),
        queued: queuedVideoIds.includes(video.id),
      }
    })
  })

  // combine results from the queries together into one mixed set...
  const totalReturnItemsCount = 20
  const itemsFromEach = Math.ceil(totalReturnItemsCount / queries.length)
  const returnResults = []
  for (let x = 0; x < itemsFromEach; x++) {
    cleanResults.forEach(results => {
      if (results.length > x) {
        returnResults.push(results[x])
      }
    })
  }

  // remove duplicate videos and return...
  const existingIds = []
  ctx.body = returnResults.filter(video => {
    if (!existingIds.includes(video.id)) {
      existingIds.push(video.id)
      return true
    }
    return false
  })
})

// identifies song details for a YouTube video
router.post('/youtubeidentify', async (ctx, next) => {
  // in case they weren't supplied, try to extract and cleanup the artist and title from the YouTube video title
  let [artist, title] = getArtistTitle(ctx.request.body.video.title, {
    defaultArtist: ctx.request.body.video.channel
  })
  const parts = []

  // but overwrite what we just did with any supplied artist or title
  if (ctx.request.body.artist !== undefined) artist = ctx.request.body.artist
  if (ctx.request.body.title !== undefined) title = ctx.request.body.title

  // join them back together in a standard "Artist - Title" form.
  if (artist) parts.push(artist)
  if (title) parts.push(title)
  const query = parts.join(' - ')

  ctx.body = {
    artist: artist,
    title: title,
    songs: [],
    lyrics: ''
  }

  // if this is a pre-made karaoke video, we're done...
  if (ctx.request.body.video.karaoke) {
    return
  }

  try {
    // search for this artist/title on Genius...
    const Client = new Genius.Client()
    ctx.body.songs = await Client.songs.search(query)

    // if a songID was provided, pick out just that song
    // it would be nice to search Genius just for that ID, but this would require a key
    if (ctx.request.body.songID) {
      ctx.body.songs = ctx.body.songs.filter((song) => {
        return (song.id === ctx.request.body.songID)
      })
    }

    // if only one song was found (or a songID was provided), get the lyrics for it immediately...
    if (ctx.body.songs.length === 1) {
      try {
        ctx.body.artist = ctx.body.songs[0].artist.name
        ctx.body.title = ctx.body.songs[0].title
        ctx.body.lyrics = await ctx.body.songs[0].lyrics()
        // remove song part identifier lines like [Chorus]...
        // ctx.body.lyrics = ctx.body.lyrics.replace(/^\[.*\]\n/mg, '') // don't really need to do this anymore, as the server handles it. could add an option to do this, though
      } catch (err) {
        /* just ignore and return empty lyrics */
      }
    }
  } catch (err) {
    if (err.message === 'No result was found') {
      ctx.body = {
        artist: artist,
        title: title,
        songs: [],
        lyrics: ''
      }
    }
  }
})

module.exports = router
