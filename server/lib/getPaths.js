const db = require('sqlite')
const squel = require('squel')
const stat = require('./async/stat')

async function getPaths () {
  const paths = {
    result: [],
    entities: {},
  }

  try {
    const q = squel.select()
      .from('paths')

    const { text, values } = q.toParam()
    const res = await db.all(text, values)

    // normalize
    res.forEach(row => {
      paths.result.push(row.pathId)
      paths.entities[row.pathId] = row
    })
  } catch (err) {
    return Promise.reject(err)
  }

  // check accessibility of each path
  for (const pathId of paths.result) {
    try {
      await stat(paths.entities[pathId].path)

      // success
      paths.entities[pathId].isOffline = false
    } catch (err) {
      paths.entities[pathId].isOffline = true
    }
  }

  return paths
}

module.exports = getPaths
