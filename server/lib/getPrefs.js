const db = require('sqlite')
const squel = require('squel')

async function getPrefs () {
  let res
  const prefs = {}

  try {
    const q = squel.select()
      .from('prefs')

    const { text, values } = q.toParam()
    res = await db.all(text, values)
  } catch (err) {
    return Promise.reject(err)
  }

  // convert domain column's 'dot format' to object
  res.forEach(row => {
    const parts = row.domain.split('.')

    if (parts.length === 1) {
      prefs[parts[0]] = JSON.parse(row.data)
    } else if (parts.length === 2) {
      prefs[parts[0]] = prefs[parts[0]] || {}
      prefs[parts[0]][parts[1]] = JSON.parse(row.data)
    }
  })

  return prefs
}

module.exports = getPrefs
