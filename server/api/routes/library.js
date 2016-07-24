import KoaRouter from 'koa-router'
import Providers from '../provider/index'

let router = KoaRouter()
let debug = require('debug')
let log = debug('app:library')
let error = debug('app:library:error')
let isScanning

// all artists and songs (normalized)
router.get('/api/library', async (ctx, next) => {
  let res = {
    artistIds: [], // results ordered alphabetically
    songUIDs: [],  // results
    artists: {},   // indexed by artistId
    songs: {},     // indexed by UID
  }

  // get artists
  let artists = await ctx.db.all('SELECT id, name FROM artists ORDER BY name')

  artists.forEach(function(row){
    res.artistIds.push(row.id)
    res.artists[row.id] = row
    res.artists[row.id].songs = []
  })

  // assign songs to artists
  let songs = await ctx.db.all('SELECT artistId, plays, provider, title, uid FROM songs ORDER BY title')

  songs.forEach(function(row){
    if (typeof res.artists[row.artistId] === 'undefined') {
      log('Warning: Invalid song (uid: %s, artistId: %s)', row.uid, row.artistId)
      return
    }

    res.songUIDs.push(row.uid)
    res.songs[row.uid] = row
    res.artists[row.artistId].songs.push(row.uid)
  })

  ctx.body = {
    artists: {result: res.artistIds, entities: res.artists},
    songs: {result: res.songUIDs, entities: res.songs}
  }
})

// scan for new songs
router.get('/api/library/scan', async (ctx, next) => {
  if (isScanning) {
    log('Scan already in progress; skipping request')
    return
  }

  isScanning = true

  // get provider configs
  let cfg = {}
  let rows = await ctx.db.all('SELECT * FROM config WHERE domain LIKE "%.provider"')

  rows.forEach(function(row){
    const provider = row.domain.substr(0, row.domain.lastIndexOf('.provider'))
    cfg[provider] = JSON.parse(row.data)
  })

  for (let provider in cfg) {
    if (!cfg[provider].enabled) {
      log('Provider "%s" not enabled; skipping', provider)
      continue
    }

    if (!Providers[provider]) {
      error('Provider "%s" is enabled but not loaded', provider)
      continue
    }
    // call each provider's scan method, passing config object and
    // koa context (from which we can access the db, and possibly
    // send progress updates down the wire?)
    log('Provider "%s" starting scan', provider)
    await Providers[provider].scan(cfg[provider], ctx)
    log('Provider "%s" finished scan', provider)
  }

  isScanning = false
})

export default router
