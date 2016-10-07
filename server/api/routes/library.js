const KoaRouter = require('koa-router')
const Providers = require('../provider/index')

const router = KoaRouter()
const debug = require('debug')
const error = debug('app:library:error')

let isScanning

// get all artists and songs
router.get('/api/library', async (ctx, next) => {
  const log = debug('app:library:get')

  let res = {
    artistIds: [], // results
    songIds: [],   // results
    artists: {},   // entities
    songs: {},     // entities
  }

  // get artists
  let artists = await ctx.db.all('SELECT artistId, name FROM artists ORDER BY name')

  artists.forEach(function(row){
    res.artistIds.push(row.artistId)
    res.artists[row.artistId] = row
    res.artists[row.artistId].songIds = []
  })

  // assign songs to artists
  let songs = await ctx.db.all('SELECT songId, artistId, title, duration, plays, provider FROM songs ORDER BY title')

  songs.forEach(function(row){
    if (typeof res.artists[row.artistId] === 'undefined') {
      log('Warning: Invalid song (songId: %s, artistId: %s)', row.songId, row.artistId)
      return
    }

    res.songIds.push(row.songId)
    res.songs[row.songId] = row
    res.artists[row.artistId].songIds.push(row.songId)
  })

  ctx.body = {
    artists: {result: res.artistIds, entities: res.artists},
    songs: {result: res.songIds, entities: res.songs}
  }
})

// scan for new songs
router.get('/api/library/scan', async (ctx, next) => {
  const log = debug('app:library:scan')

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
    await Providers[provider].scan(ctx, cfg[provider])
    log('Provider "%s" finished scan', provider)
  }

  // delete artists having no songs
  let res = await ctx.db.run('DELETE FROM artists WHERE artistId IN (SELECT artistId FROM artists LEFT JOIN songs USING(artistId) WHERE songs.artistId IS NULL)')
  log('cleanup: removed %s artists with no songs', res.changes)

  isScanning = false
  log('Library scan complete')
})

module.exports = router
