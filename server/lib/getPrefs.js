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

  // json-decode key/val pairs
  res.forEach(row => {
    prefs[row.key] = JSON.parse(row.data)
  })

  return prefs
}

module.exports = getPrefs
