import Providers from '../providers/index'
import KoaRouter from 'koa-router'
let router = KoaRouter()
let debug = require('debug')
var log = debug('app:library')
var error = debug('app:library:error')

let isScanning

// list all artists
router.get('/api/artists', async (ctx, next) => {
  log('Artist list requested')
  let artists = await ctx.db.all('SELECT artists.*, COUNT(songs.artist_id) AS count FROM artists JOIN songs ON artists.id = songs.artist_id GROUP BY artist_id ORDER BY artists.name')
  log('Responding with %s artists', artists.length)
  ctx.body = artists
})

// get songs for artistId
router.get('/api/artists/:id', async (ctx, next) => {
  let artistId = ctx.params.id
  let songs = await ctx.db.all('SELECT songs.* FROM songs JOIN artists ON artists.id = songs.artist_id WHERE artist_id = ? ORDER BY songs.title', [artistId])
  log('Returning %s songs for artistId=%s', songs.length, artistId)
  ctx.body = songs
})

// scan for new songs
router.get('/api/library/scan', async (ctx, next) => {
  if (isScanning) {
    error('Scan already in progress; aborting')
    return
  }

  isScanning = true

  for (let provider in Providers) {
    log('Getting configuration for provider "%s"', provider)

    // get provider's full config
    let rows = await ctx.db.all('SELECT * FROM config WHERE domain = ?', [provider])
    let config = rows2obj(rows)

    if (typeof config !== 'object') {
      log('Error reading configuration')
      continue
    }

    if (!config.enabled) {
      log('Provider not enabled; skipping')
      continue
    }

    // call each provider's scan method, passing config object and
    // koa context (from which we can access the db, and possibly
    // send progress updates down the wire?)
    //
    // these scans could eventually be asynchronous (by removing 'await')
    // but doing it synchronously for now
    log('Provider \'%s\' starting scan', provider)
    Providers[provider].scan(config, ctx)
    log('Provider \'%s\' finished', provider)
  }

  isScanning = false
})

export default router

// helper
function rows2obj(rows) {
  if (!rows) return false

  let out = {}
  rows.forEach(function(row){
    let {key, val} = row

    // simple transform for booleans
    if (val === '0') val = false
    if (val === '1') val = true

    if (typeof out[key] !== 'undefined') {
      if (Array.isArray(out[key])) {
        return out[key].push(val)
      } else {
        return out[key] = [out[key], val]
      }
    }

    out[key] = val
  })
  return out
}
