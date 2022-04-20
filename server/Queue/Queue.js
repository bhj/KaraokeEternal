const path = require('path')
const db = require('../lib/Database').db
const sql = require('sqlate')

class Queue {
  /**
   * Add a songId to a room's queue
   *
   * @param  {object}      roomId, songId, userId
   * @return {Promise}
   */
  static async add ({ roomId, songId, userId }) {
    const fields = new Map()
    fields.set('roomId', roomId)
    fields.set('songId', songId)
    fields.set('userId', userId)
    fields.set('prevQueueId', sql`(
      SELECT queueId
      FROM queue
      WHERE roomId = ${roomId} AND queueId NOT IN (
        SELECT prevQueueId
        FROM queue
        WHERE prevQueueId IS NOT NULL
      )
    )`)

    const query = sql`
      INSERT INTO queue ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    if (res.changes !== 1) {
      throw new Error('Could not add song to queue')
    }
  }

  /**
   * Get queued items for a given room
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async get (roomId) {
    const result = []
    const entities = {}
    const map = new Map()
    let curQueueId = null

    const query = sql`
      SELECT queueId, songId, userId, prevQueueId,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        INNER JOIN media USING(songId)
        INNER JOIN paths USING(pathId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY queueId, paths.priority ASC
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      entities[row.queueId] = row
      entities[row.queueId].mediaType = this.getType(row.relPath)

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].isPreferred

      if (row.prevQueueId === null) {
        // found the first item
        result.push(row.queueId)
        curQueueId = row.queueId
      } else {
        // map indexed by prevQueueId
        map.set(row.prevQueueId, row.queueId)
      }
    }

    while (result.length < rows.length) {
      // get the item whose prevQueueId references the current one
      const nextQueueId = entities[map.get(curQueueId)].queueId
      result.push(nextQueueId)
      curQueueId = nextQueueId
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
   *
   * We could DELETE first and get the deleted item's prevQueueId using
   * RETURNING, but the DELETE and UPDATE need to be wrapped in a transaction
   * (so the prevQueueId foreign key check is deferred). Also, v0.9 betas didn't
   * have prevQueueId DEFFERABLE, and so will still error at DELETE (do we care?)
   *
   * @param  {object}      queueId, userId
   * @return {Promise}     undefined
   */
  static async remove (queueId) {
    // close the soon-to-be gap first
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
    `
    await db.run(String(updateQuery), updateQuery.parameters)

    // delete item
    const deleteQuery = sql`
      DELETE FROM queue
      WHERE queueId = ${queueId}
    `
    const deleteRes = await db.run(String(deleteQuery), deleteQuery.parameters)

    if (!deleteRes.changes) {
      throw new Error(`Could not remove queueId: ${queueId}`)
    }
  }

  /**
   * Check if a user owns a queue item
   * @param  {number} userId
   * @param  {number} queueId
   * @return {boolean}
   */
  static async isOwner (userId, queueId) {
    const query = sql`
      SELECT COUNT(*) AS count
      FROM queue
      WHERE userId = ${userId} AND queueId = ${queueId}
    `
    const res = await db.get(String(query), query.parameters)
    return res.count === 1
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
