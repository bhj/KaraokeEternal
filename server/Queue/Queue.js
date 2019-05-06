const path = require('path')
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
      .field('media.duration, media.isPreferred, media.relPath')
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
          entities[row.queueId].player = this.getPlayer(row.relPath)
        }

        continue
      }

      result.push(row.queueId)
      entities[row.queueId] = row
      entities[row.queueId].player = this.getPlayer(row.relPath)
      delete entities[row.queueId].relPath
    }

    return { result, entities }
  }

  /**
   * Get player type from media file extension
   * @param  {string} file filename
   * @return {string}      player component
   */
  static getPlayer (file) {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

module.exports = Queue
