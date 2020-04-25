const path = require('path')
const db = require('sqlite')
const sql = require('sqlate')

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

    const query = sql`
      SELECT queueId, songId, userId,
        media.isPreferred, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated
      FROM
        queue
        INNER JOIN users USING(userId)
        INNER JOIN media USING (songId)
        INNER JOIN paths USING (pathId)
      WHERE roomId = ${roomId}
      ORDER BY queueId, paths.priority ASC
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      if (entities[row.queueId]) {
        if (row.isPreferred) {
          entities[row.queueId].mediaId = row.mediaId
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
