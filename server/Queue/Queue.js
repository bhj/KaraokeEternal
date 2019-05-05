const db = require('sqlite')
const squel = require('squel')

class Queue {
  /**
   * Get queued items for a given room
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async get (roomId) {
    const result = []
    const entities = {}

    const q = squel.select()
      .field('queueId, mediaId, userId')
      .field('media.player, media.duration, media.isPreferred')
      .field('artists.name AS artist')
      .field('songs.songId, songs.title')
      .field('users.name AS userDisplayName, users.dateUpdated')
      .from('queue')
      .join('users USING(userId)')
      .join('media USING(songId)')
      .join('songs USING (songId)')
      .join('paths USING (pathId)')
      .join('artists USING (artistId)')
      .where('roomId = ?', roomId)
      .order('queueId, paths.priority')

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    for (const row of rows) {
      if (entities[row.queueId]) {
        if (row.isPreferred) {
          entities[row.queueId].mediaId = row.mediaId
          entities[row.queueId].duration = row.duration
          entities[row.queueId].player = row.player
        }

        continue
      }

      result.push(row.queueId)
      entities[row.queueId] = row
    }

    return { result, entities }
  }
}

module.exports = Queue
