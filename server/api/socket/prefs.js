const db = require('sqlite')
const log = require('debug')('app:socket:prefs')

const PREFS_CHANGE_REQUEST = 'server/PREFS_CHANGE'
const PREFS_CHANGE = 'ui/PREFS_CHANGE'

const ACTION_HANDLERS = {
  [PREFS_CHANGE_REQUEST]: async (ctx, {payload}) => {
    if (!payload.domain || !payload.data) {
      return Promise.reject(new Error('invalid pref data'))
    }

    try {
      let res = await db.run('UPDATE prefs SET data = ? WHERE domain = ?',
        JSON.stringify(payload.data), payload.domain
      )
    } catch(err) {
      return Promise.reject(err)
    }

    ctx.io.emit('action', {
      type: PREFS_CHANGE,
      payload: await getPrefs()
    })
  },
}

async function getPrefs() {
  let cfg = {}

  try {
    let rows = await db.all('SELECT * FROM prefs')

    rows.forEach(function(row){
      let parts = row.domain.split('.')
      if (typeof cfg[parts[0]] === 'undefined') cfg[parts[0]] = {}
      cfg[parts[0]][parts[1]] = JSON.parse(row.data)
    })

    return Promise.resolve(cfg)
  } catch(err) {
    return Promise.reject(err)
  }
}

module.exports = {
  ACTION_HANDLERS,
  getPrefs,
}
