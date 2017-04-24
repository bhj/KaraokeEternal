const db = require('sqlite')
const squel = require('squel')
const getPrefs = require('../../lib/getPrefs')

const {
  SET_PREFS,
  PREFS_UPDATE,
} = require('../constants')

const ACTION_HANDLERS = {
  [SET_PREFS]: async (ctx, { payload }) => {
    if (!payload.domain || !payload.data) {
      return Promise.reject(new Error('invalid pref data'))
    }

    // save prefs
    try {
      const q = squel.update()
        .table('prefs')
        .set('data = ?', JSON.stringify(payload.data))
        .where('domain = ?', payload.domain)

      const { text, values } = q.toParam()
      await db.run(text, values)
    } catch (err) {
      return Promise.reject(err)
    }

    // send updated prefs
    try {
      ctx.io.emit('action', {
        type: PREFS_UPDATE,
        payload: await getPrefs()
      })
    } catch (err) {
      return Promise.reject(err)
    }
  },
}

module.exports = ACTION_HANDLERS
