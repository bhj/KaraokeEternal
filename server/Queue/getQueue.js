const db = require('sqlite')
const squel = require('squel')

async function getQueue (roomId) {
  const result = []
  const entities = {}

  try {
    const q = squel.select()
      .field('queueId, mediaId, userId')
      .field('media.title, media.duration, media.provider, media.providerData')
      .field('users.name AS username, artists.name AS artist')
      .from('queue')
      .join('users USING(userId)')
      .join('media USING(mediaId)')
      .join('artists USING (artistId)')
      .where('roomId = ?', roomId)
      .order('queueId')

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    for (const row of rows) {
      result.push(row.queueId)
      row.providerData = JSON.parse(row.providerData)
      entities[row.queueId] = row
    }
  } catch (err) {
    return Promise.reject(err)
  }

  return { result, entities }
}

module.exports = getQueue
