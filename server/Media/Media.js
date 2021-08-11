const db = require('../lib/Database').db
const sql = require('sqlate')
const log = require('../lib/Log').getLogger('Media')
const Toast = require('../lib/Toast')
const Queue = require('../Queue')
const Rooms = require('../Rooms')
const Prefs = require('../Prefs')
const rimraf = require('rimraf')
const path = require('path')

const {
  QUEUE_PUSH,
} = require('../../shared/actionTypes')

class Media {
  /**
   * Get media matching all search criteria
   *
   * @param  {Object}  filter Search criteria
   * @return {Promise}        Object with media results
   */
  static async search (filter) {
    const media = {
      result: [],
      entities: {}
    }

    const whereClause = typeof filter !== 'object'
      ? sql`true`
      : sql`${sql.tuple(Object.keys(filter).map(sql.column))} = ${sql.tuple(Object.values(filter))}`

    const query = sql`
      SELECT
        media.*,
        songs.*,
        artists.artistId, artists.name AS artist, artists.nameNorm AS artistNorm,
        paths.pathId, paths.path
      FROM media
        INNER JOIN songs USING (songId)
        INNER JOIN artists USING (artistId)
        INNER JOIN paths USING (pathId)
      WHERE ${whereClause}
      ORDER BY paths.priority ASC
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      media.result.push(row.mediaId)
      media.entities[row.mediaId] = row
    }

    return media
  }

  /**
   * Add media file to the library
   *
   * @param  {Object}  media Media object
   * @return {Number}        New media's mediaId
   */
  static async add (media) {
    if (!Number.isInteger(media.songId) ||
        !Number.isInteger(media.duration) ||
        !Number.isInteger(media.pathId) ||
        !media.relPath
    ) throw new Error('invalid media data: ' + JSON.stringify(media))

    // currently uses an Object instead of Map
    const query = sql`
      INSERT INTO media ${sql.tuple(Object.keys(media).map(sql.column))}
      VALUES ${sql.tuple(Object.values(media))}
    `
    const res = await db.run(String(query), query.parameters)

    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid lastID from media insert')
    }

    return res.lastID
  }

  /**
   * Update media item
   *
   * @param  {Object}  media Media object
   * @return {Promise}
   */
  static async update (media) {
    const { mediaId } = media

    if (!Number.isInteger(mediaId)) {
      throw new Error(`invalid mediaId: ${mediaId}`)
    }

    // currently uses an Object instead of Map
    delete media.mediaId

    const query = sql`
      UPDATE media
      SET ${sql.tuple(Object.keys(media).map(sql.column))} = ${sql.tuple(Object.values(media))}
      WHERE mediaId = ${mediaId}
    `
    await db.run(String(query), query.parameters)
  }

  /**
   * Removes media from the db in sqlite-friendly batches
   *
   * @param  {Array}  mediaIds
   * @return {Promise}
   */
  static async remove (mediaIds) {
    const batchSize = 999

    while (mediaIds.length) {
      const query = sql`
        DELETE FROM media
        WHERE mediaId IN ${sql.in(mediaIds.splice(0, batchSize))}
      `
      const res = await db.run(String(query), query.parameters)

      log.info(`removed ${res.changes} media`)
    }
  }

  /**
   * Remove unlinked items and VACUUM
   *
   * @return {Promise}
   */
  static async cleanup () {
    let res

    // remove media in nonexistent paths
    res = await db.run(`
      DELETE FROM media WHERE mediaId IN (
        SELECT media.mediaId FROM media LEFT JOIN paths USING(pathId) WHERE paths.pathId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} media in nonexistent paths`)

    // remove stars for nonexistent songs
    res = await db.run(`
      DELETE FROM songStars WHERE songId IN (
        SELECT songStars.songId FROM songStars LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} stars for nonexistent songs`)

    log.info('cleanup: vacuuming database')
    await db.run('VACUUM')
  }

  /**
   * Set isPreferred flag for a given media item
   * @param  {Number}  mediaId
   * @param  {Boolean} isPreferred
   * @return {Promise} songId of the (un)preferred media item
   */
  static async setPreferred (mediaId, isPreferred) {
    if (!Number.isInteger(mediaId) || typeof isPreferred !== 'boolean') {
      throw new Error('invalid mediaId or value')
    }

    // get songId
    const res = await Media.search({ mediaId })

    if (!res.result.length) {
      throw new Error(`mediaId not found: ${mediaId}`)
    }

    const songId = res.entities[mediaId].songId

    // clear any currently preferred items
    const query = sql`
      UPDATE media
      SET isPreferred = 0
      WHERE songId = ${songId}
    `
    await db.run(String(query), query.parameters)

    if (isPreferred) {
      await Media.update({ mediaId, isPreferred: 1 })
    }

    return songId
  }

  /**
   * Update media item
   *
   * @param  {Object}  media Media object
   * @return {Promise}
   */
  static async updateYoutubeVideo (data, io) {
    const { video } = data
    const youtubeVideoId = video.youtubeVideoId

    if (!Number.isInteger(video.id)) {
      throw new Error(`invalid video ID: ${video.id}`)
    }

    // get the queue entries that use this video...
    const queueQuery = sql`
      SELECT *
      FROM queue
      WHERE youtubeVideoId = ${youtubeVideoId}
    `
    const queueRows = await db.all(String(queueQuery), queueQuery.parameters)
    const roomIds = queueRows.map(row => row.roomId)

    // there's not much to do if the video is no longer queued anywhere
    if (queueRows.length) {
      // we sometimes do something special for status updates, like send toast notifications...
      if (Object.prototype.hasOwnProperty.call(data, 'status')) {
        const userIds = queueRows.map(row => row.userId)
        if (data.status === 'failed') {
          Toast.sendToUser(io, userIds, {
            content: '😥 A karaoke mix for "' + data.video.title + '" by ' + data.video.artist + ' could not be created. Let your host know, and maybe try a pre-made karaoke mix for now.',
            type: 'error'
          })

          // also remove this failed video from all queues...
          const deleteQuery = sql`
            DELETE FROM queue
            WHERE youtubeVideoId = ${youtubeVideoId}
          `
          await db.run(String(deleteQuery), deleteQuery.parameters)
        } else if (data.status === 'ready') {
          if (data.video.karaoke) {
            Toast.sendToUser(io, userIds, {
              content: '🤩 "' + data.video.title + '" by ' + data.video.artist + ' downloaded successfully!'
            })
          } else {
            Toast.sendToUser(io, userIds, {
              content: '🤩 The karaoke mix for "' + data.video.title + '" by ' + data.video.artist + ' is ready!'
            })
          }
        }
      }

      // currently uses an Object instead of Map
      delete data.video

      if (Object.keys(data).length) {
        const query = sql`
          UPDATE youtubeVideos
          SET ${sql.tuple(Object.keys(data).map(sql.column))} = ${sql.tuple(Object.values(data))}
          WHERE id = ${video.id}
        `
        await db.run(String(query), query.parameters)
      }

      // update the applicable rooms...
      roomIds.forEach(async roomId => {
        io.to(Rooms.prefix(roomId)).emit('action', {
          type: QUEUE_PUSH,
          payload: await Queue.get(roomId)
        })
      })
    }

    // if the video is no longer queued anywhere, delete it and cleanup the tmp folder...
    if (!queueRows.length || data.status === 'failed') {
      const deleteQuery = sql`
        DELETE FROM youtubeVideos
        WHERE youtubeVideoId = ${youtubeVideoId}
      `
      await db.run(String(deleteQuery), deleteQuery.parameters)

      // delete the video's tmp folder...
      const prefs = await Prefs.get()
      rimraf(path.join(prefs.tmpOutputPath, youtubeVideoId), () => { })
    }
  }
}

Media.mimeTypes = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  cdg: 'application/octet-stream',
}

module.exports = Media
