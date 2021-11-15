const path = require('path')
const db = require('../lib/Database').db
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
      SELECT queueId, songId, userId, prevQueueId,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        INNER JOIN media USING (songId)
        INNER JOIN paths USING (pathId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY queueId, paths.priority ASC
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      result.push(row.queueId)
      entities[row.queueId] = row
      entities[row.queueId].mediaType = this.getType(row.relPath)

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].isPreferred
    }

    return { result, entities }
  }

  /**
   * Move a queue item
   * @param  {object}      prevQueueId, queueId, roomId
   * @return {Promise}     undefined
   */
  static async move ({ prevQueueId, queueId, roomId }) {
    if (queueId === prevQueueId) {
      throw new Error('Invalid prevQueueId')
    }

    if (prevQueueId === -1) prevQueueId = null

    const query = sql`
      UPDATE queue
      SET prevQueueId = CASE
        WHEN queueId = newChild THEN ${queueId}
        WHEN queueId = curChild AND curParent IS NOT NULL AND newChild IS NOT NULL THEN curParent
        WHEN queueId = ${queueId} THEN ${prevQueueId}
        ELSE queue.prevQueueId
      END
      FROM (SELECT
        (
          SELECT prevQueueId
          FROM queue
          WHERE queueId = ${queueId}
        ) AS curParent,
        (
          SELECT queueId
          FROM queue
          WHERE prevQueueId = ${queueId}
        ) AS curChild,
        (
          SELECT queueId
          FROM queue
          WHERE queueId != ${queueId}
            AND prevQueueId ${prevQueueId === null ? sql`IS NULL` : sql`= ${prevQueueId}`}
            AND roomId = ${roomId}
        ) AS newChild
      )
      WHERE roomId = ${roomId}
    `
    await db.run(String(query), query.parameters)
  }

  /**
   * Delete a queue item
   * @param  {object}      queueId, roomId, userId
   * @return {Promise}     undefined
   */
  static async remove ({ queueId, roomId, userId }) {
    // close the soon-to-be gap first
    // @todo: once RETURNING is supported we could do the
    // deletion first and get the deleted item's prevQueueId
    const updateQuery = sql`
      UPDATE queue
      SET prevQueueId = curParent
      FROM (
        SELECT
          (
            SELECT prevQueueId
            FROM queue
            WHERE queueId = ${queueId}
          ) AS curParent,
          (
            SELECT queueId
            FROM queue
            WHERE prevQueueId = ${queueId}
          ) AS curChild
      )
      WHERE queueId = curChild
        AND roomId = ${roomId}
        ${typeof userId === 'number' ? sql`AND userId = ${userId}` : sql``}
    `
    await db.run(String(updateQuery), updateQuery.parameters)

    // delete item
    const deleteQuery = sql`
      DELETE FROM queue
      WHERE queueId = ${queueId}
        AND roomId = ${roomId}
        ${typeof userId === 'number' ? sql`AND userId = ${userId}` : sql``}
    `
    const deleteRes = await db.run(String(deleteQuery), deleteQuery.parameters)

    if (!deleteRes.changes) {
      throw new Error(`Could not remove queueId: ${queueId}`)
    }
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
