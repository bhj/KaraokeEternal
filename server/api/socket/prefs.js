const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:prefs')

const PREFS_CHANGE_REQUEST = 'server/PREFS_CHANGE'
const PREFS_CHANGE = 'ui/PREFS_CHANGE'

const ACTION_HANDLERS = {
  [PREFS_CHANGE_REQUEST]: async (ctx, {payload}) => {
    if (!payload.domain || !payload.data) {
      return Promise.reject(new Error('invalid pref data'))
    }

    try {
      const q = squel.update()
        .table('prefs')
        .set('data = ?', JSON.stringify(payload.data))
        .where('domain = ?', payload.domain)

      const { text, values } = q.toParam()
      await db.run(text, values)
    } catch(err) {
      return Promise.reject(err)
    }

    ctx.io.emit('action', {
      type: PREFS_CHANGE,
      payload: await getPrefs()
    })
  },
}

async function getPrefs(domain) {
  let res

  try {
    const q = squel.select()
      .from('prefs')

    if (domain) {
      q.where('domain = ?', domain)
    }
    const { text, values } = q.toParam()
    res = await db.all(text, values)

    if (!res.length) {
      throw new Error('no prefs for domain: '+domain)
    }
  } catch(err) {
    return Promise.reject(err)
  }

  if (domain) {
    return JSON.parse(res[0].data)
  }

  let cfg = {}
  res.forEach(function(row){
    let parts = row.domain.split('.')
    if (typeof cfg[parts[0]] === 'undefined') cfg[parts[0]] = {}
    cfg[parts[0]][parts[1]] = JSON.parse(row.data)
  })

  return cfg
}

module.exports = {
  ACTION_HANDLERS,
  getPrefs,
  PREFS_CHANGE,
}
