const db = require('sqlite')
const squel = require('squel')

async function getPrefs (domain) {
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
      throw new Error('no prefs for domain: ' + domain)
    }
  } catch (err) {
    return Promise.reject(err)
  }

  if (domain) {
    return JSON.parse(res[0].data)
  }

  let cfg = {}
  res.forEach(function (row) {
    let parts = row.domain.split('.')
    if (typeof cfg[parts[0]] === 'undefined') cfg[parts[0]] = {}
    cfg[parts[0]][parts[1]] = JSON.parse(row.data)
  })

  return cfg
}

module.exports = getPrefs
