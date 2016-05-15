import Providers from '../providers/index'
import KoaRouter from 'koa-router'
let router = KoaRouter()
let debug = require('debug')
var log = debug('app:library')
var error = debug('app:library:error')

// scan files
let isScanning

router.get('/api/library/scan', async (ctx, next) => {
  if (isScanning) {
    error('Scan already in progress; aborting')
    return
  }

  isScanning = true

  for (let provider in Providers) {
    log('Init provider "%s"', provider)

    // get provider's full config
    let rows = await ctx.db.all('SELECT * FROM config WHERE domain = ?', [provider])
    let config = {}

    rows.forEach(function(row){
      let {key, val} = row

      // simple transform for booleans
      if (val === '0') val = false
      if (val === '1') val = true

      if (typeof config[key] !== 'undefined') {
        if (Array.isArray(config[key])) {
          return config[key].push(val)
        } else {
          return config[key] = [config[key], val]
        }
      }

      config[key] = val
    })

    if (!config.enabled) {
      log('Provider \'%s\'not enabled; skipping', provider)
      continue
    }

    // call each provider's scan method, passing config object and
    // koa context (from which we can access the db, and possibly
    // send progress updates down the wire?)
    //
    // these scans could eventually be asynchronous (by removing 'await')
    // but doing it synchronously for now
    await Providers[provider].scan(config, ctx)
    log('Provider \'%s\' finished', provider)
  }

  isScanning = false
})

export default router
