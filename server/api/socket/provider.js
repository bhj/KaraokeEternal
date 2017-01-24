const db = require('sqlite')
const debug = require('debug')
const Providers = require('../../providers')
const getPrefs = require('./prefs').getPrefs

const PROVIDER_REFRESH_REQUEST = 'server/PROVIDER_REFRESH'
const LIBRARY_CHANGE = 'library/LIBRARY_CHANGE'

let isScanning

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PROVIDER_REFRESH_REQUEST]: async (ctx, {payload}) => {
    const log = debug('app:provider:refresh')
    let cfg

    if (typeof Providers[payload] === 'undefined') {
      return Promise.reject(new Error('provider not loaded: '+payload))
    }

    try {
      cfg = await getPrefs('provider.'+payload)
    } catch(err) {
      return Promise.reject(err)
    }

    if (!cfg.enabled) {
      log('Provider "%s" not enabled; skipping', payload)
      return
    }

    if (isScanning) {
      log('ignoring request: scan already in progress')
      return
    }

    log('Provider "%s" starting scan', payload)
    isScanning = true
    let validIds

    // call provider's scan method
    try {
      validIds = await Providers[payload].scan(ctx, cfg)
      log('Provider "%s" finished scan; %s valid songs', payload, validIds.length)
    } catch(err) {
      return Promise.reject(err)
    }

    // delete songs not in our valid list
    let res = await db.run('DELETE FROM songs WHERE provider = ? AND songId NOT IN ('+validIds.join(',')+')', payload)
    log('cleanup: removed %s invalid songs', res.stmt.changes)

    // delete artists having no songs
    res = await db.run('DELETE FROM artists WHERE artistId IN (SELECT artistId FROM artists LEFT JOIN songs USING(artistId) WHERE songs.artistId IS NULL)')
    log('cleanup: removed %s artists with no songs', res.stmt.changes)

    isScanning = false
    log('Library scan complete')
  },
}

module.exports = {
  ACTION_HANDLERS,
}
