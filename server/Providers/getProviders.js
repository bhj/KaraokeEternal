const db = require('sqlite')
const squel = require('squel')

async function getProviders () {
  const providers = {
    result: [],
    entities: {},
  }

  try {
    const q = squel.select()
      .from('providers')
      .order('priority')

    const { text, values } = q.toParam()
    const res = await db.all(text, values)

    // normalize
    res.forEach(row => {
      providers.result.push(row.name)
      providers.entities[row.name] = row

      // parse JSON in prefs column
      providers.entities[row.name].prefs = JSON.parse(row.prefs)
    })
  } catch (err) {
    return Promise.reject(err)
  }

  return providers
}

module.exports = getProviders
