const db = require('sqlite')
const KoaRouter = require('koa-router')
const router = KoaRouter()
const debug = require('debug')

const Providers = require('../../providers')
let isScanning

// scan for new songs
router.get('/api/library/scan', async (ctx, next) => {
  const log = debug('app:library:scan')

  if (isScanning) {
    log('ignoring request: scan already in progress')
    return
  }

  isScanning = true

  // get provider configs
  let cfg = {}
  let rows = await db.all('SELECT * FROM config WHERE domain LIKE "%.provider"')

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
      log('Provider "%s" is enabled but not loaded', provider)
      continue
    }

    const Provider = Providers[provider]
    const scanner =  Providers[provider].getScanner
    log('Provider "%s" starting scan', provider)

    // call each provider's scan method
    let validIds = await Provider.scan(ctx, cfg[provider])
    log('Provider "%s" finished scan; %s valid songs', provider, validIds.length)

    // delete songs not in our valid list
    let res = await db.run('DELETE FROM songs WHERE provider = ? AND songId NOT IN ('+validIds.join(',')+')', provider)
    log('cleanup: removed %s invalid songs', res.stmt.changes)
  }

  // delete artists having no songs
  res = await db.run('DELETE FROM artists WHERE artistId IN (SELECT artistId FROM artists LEFT JOIN songs USING(artistId) WHERE songs.artistId IS NULL)')
  log('cleanup: removed %s artists with no songs', res.stmt.changes)

  isScanning = false
  log('Library scan complete')
})

module.exports = router
