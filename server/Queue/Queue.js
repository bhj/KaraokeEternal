const db = require('sqlite')
const squel = require('squel')

class Queue {
  /**
   * Get queued "songs" for a given room
   *
   * @param  {[type]}  roomId
   * @return {Promise}
   */
  static async getQueue (roomId) {
    const result = []
    const entities = {}

    try {
      const q = squel.select()
        .field('queueId, mediaId, userId')
        .field('media.duration, media.provider, media.providerData')
        .field('artists.name AS artist')
        .field('songs.songId, songs.title')
        .field('users.name AS username')
        .from('queue')
        .join('users USING(userId)')
        .join('media USING(mediaId)')
        .join('songs USING (songId)')
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
}

module.exports = Queue
