const path = require('path')
const db = require('../lib/Database').db
const sql = require('sqlate')
const fs = require('fs')
const Prefs = require('../Prefs')

class Queue {
  /**
   * Get queued items for a given room
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async get (roomId) {
    const prefs = await Prefs.get()
    const result = []
    const entities = {}

    const query = sql`
      SELECT queueId, songId, queue.userId, youtubeVideoId,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated,
        youtubeVideos.thumbnail AS youtubeVideoThumbnail,
        youtubeVideos.artist AS youtubeVideoArtist,
        youtubeVideos.title AS youtubeVideoTitle,
        youtubeVideos.duration AS youtubeVideoDuration,
        youtubeVideos.karaoke AS youtubeVideoKaraoke,
        youtubeVideos.status AS youtubeVideoStatus,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        LEFT JOIN media USING (songId)
        LEFT JOIN paths USING (pathId)
        LEFT JOIN youtubeVideos USING (youtubeVideoId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY queueId, paths.priority ASC
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      result.push(row.queueId)
      entities[row.queueId] = row

      entities[row.queueId].youtubeAlignedLyrics = null
      if (row.youtubeVideoId) { // we need to do some extra work for youtube videos
        entities[row.queueId].mediaType = 'youtube'
        if (row.youtubeVideoStatus === 'ready') {
          try {
            // we have a processed youtube video, so there should be a karaoke.mp4 file...
            if (fs.existsSync(prefs.tmpOutputPath + '/' + row.youtubeVideoId + '/karaoke.mp4') &&
              fs.statSync(prefs.tmpOutputPath + '/' + row.youtubeVideoId + '/karaoke.mp4').size >= 1000
            ) {
              if (!row.youtubeVideoKaraoke &&
                fs.existsSync(prefs.tmpOutputPath + '/' + row.youtubeVideoId + '/aligned.txt') &&
                fs.statSync(prefs.tmpOutputPath + '/' + row.youtubeVideoId + '/aligned.txt').size >= 1000
              ) { // this is a processed youtube video with aligned lyrics. Let's load them...
                entities[row.queueId].youtubeAlignedLyrics = JSON.parse(
                  fs.readFileSync(prefs.tmpOutputPath + '/' + row.youtubeVideoId + '/aligned.txt')
                )
              }
            } else {
              throw Error('Could not find karaoke.mp4 file')
            }
          } catch (err) {
            // something went wrong loading a file. TODO: show an error?
          }
        }
      } else {
        entities[row.queueId].mediaType = (row.relPath) ? this.getType(row.relPath) : 'unknown'
      }

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].isPreferred
    }

    return { result, entities }
  }

  /**
   * Get media type from file extension
   * @param  {string} file filename
   * @return {string}      player component
   */
  static getType (file) {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

module.exports = Queue
