const db = require('sqlite')
const squel = require('squel')

async function getQueue (roomId) {
  const result = []
  const entities = {}
  let rows

  try {
    const q = squel.select()
      .from('queue')
      .field('queueId')
      .field('songId')
      .field('userId')
      .field('songs.*')
      .field('users.name')
      .join('songs USING(songId)')
      .join('users USING(userId)')
      .where('roomId = ?', roomId)
      .order('queueId')

    const { text, values } = q.toParam()
    rows = await db.all(text, values)
  } catch (err) {
    return Promise.reject(err)
  }

  rows.forEach(function (row) {
    result.push(row.queueId)
    entities[row.queueId] = row
    entities[row.queueId].providerData = JSON.parse(row.providerData)
  })

  return { result, entities }
}

module.exports = getQueue
