const db = require('sqlite')
const squel = require('squel')

async function getPrefs (domain) {
  const prefs = {}
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

  res.forEach(function (row) {
    let parts = row.domain.split('.')

    if (parts.length === 1) {
      // no dot in domain
      prefs[parts[0]] = JSON.parse(row.data)
    } else if (parts.length === 2) {
      prefs[parts[0]] = {}
      prefs[parts[0]][parts[1]] = JSON.parse(row.data)
    }
  })

  return prefs
}

module.exports = getPrefs
