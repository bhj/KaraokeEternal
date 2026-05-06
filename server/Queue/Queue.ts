import path from 'path'
import { db } from '../lib/Database.js'
import sql from 'sqlate'
import { QueueItem } from '../../shared/types.js'

class Queue {
  /**
   * Resolve which mediaId to use for a given (songId, userId, roomId) triple.
   *
   * Resolution order (highest priority wins):
   *   1. userMediaPrefs  — the user's explicit personal choice
   *   2. roomMediaPrefs  — the room manager's default for this room
   *   3. media.isPreferred — the global admin default
   *   4. paths.priority ASC — lowest-priority path, first media file (fallback)
   *
   * The ORDER BY trick: correlated subqueries return 1 when the row matches
   * the preference, 0 otherwise. Sorting DESC on these puts the matching row
   * first without needing multiple queries.
   */
  static resolveMediaId (songId: number, userId: number, roomId: number): number {
    const query = sql`
      SELECT m.mediaId
      FROM media m
      INNER JOIN paths p ON m.pathId = p.pathId
      WHERE m.songId = ${songId}
      ORDER BY
        (SELECT COUNT(*) FROM userMediaPrefs WHERE userId = ${userId} AND songId = ${songId} AND mediaId = m.mediaId) DESC,
        (SELECT COUNT(*) FROM roomMediaPrefs WHERE roomId = ${roomId} AND songId = ${songId} AND mediaId = m.mediaId) DESC,
        m.isPreferred DESC,
        p.priority ASC
      LIMIT 1
    `
    const row = db.get<{ mediaId: number }>(String(query), query.parameters)

    if (!row) {
      throw new Error(`No media found for songId ${songId}`)
    }

    return row.mediaId
  }

  /**
   * Re-resolve queue.mediaId for rows affected by a preference change.
   *
   * Called after any preference is set or cleared so that already-queued
   * songs reflect the new choice immediately.  Returns the distinct roomIds
   * whose queues were updated so the caller can emit QUEUE_PUSH for them.
   *
   * Scope rules:
   *   'user'   — re-resolve only rows queued by this user (highest priority;
   *              no need to exclude others since their prefs are unaffected)
   *   'room'   — re-resolve rows in this room that have no personal pref
   *              (personal prefs override room default, so those rows keep
   *              their existing mediaId)
   *   'global' — re-resolve rows that have neither a personal nor room pref
   */
  static rerouteForPref (params: {
    scope: 'user' | 'room' | 'global'
    songId: number
    userId?: number
    roomId?: number
  }): number[] {
    const { scope, songId, userId, roomId } = params

    // Fetch the full row context for each queue entry we need to update.
    // We cannot use a single correlated UPDATE with ORDER BY subqueries because
    // SQLite cannot resolve outer-table column references (queue.userId etc.)
    // from inside a scalar subquery's ORDER BY — only two levels of correlation
    // are supported.  Instead we fetch rows in JS and call resolveMediaId()
    // per row, which uses bound parameters rather than SQL correlation.
    let rowsQuery: ReturnType<typeof sql>
    if (scope === 'user') {
      rowsQuery = sql`
        SELECT queueId, songId, userId, roomId FROM queue
        WHERE songId = ${songId} AND userId = ${userId}
      `
    } else if (scope === 'room') {
      // Skip rows where the user has set a personal preference — those are
      // at a higher priority tier and must not be overwritten.
      rowsQuery = sql`
        SELECT queueId, songId, userId, roomId FROM queue
        WHERE songId = ${songId} AND roomId = ${roomId}
          AND userId NOT IN (SELECT userId FROM userMediaPrefs WHERE songId = ${songId})
      `
    } else {
      // Global scope: skip rows covered by either a room or user preference.
      rowsQuery = sql`
        SELECT queueId, songId, userId, roomId FROM queue
        WHERE songId = ${songId}
          AND userId NOT IN (SELECT userId FROM userMediaPrefs WHERE songId = ${songId})
          AND roomId NOT IN (SELECT roomId FROM roomMediaPrefs  WHERE songId = ${songId})
      `
    }

    const rows = db.all<{ queueId: number, songId: number, userId: number, roomId: number }>(
      String(rowsQuery), rowsQuery.parameters,
    )

    if (rows.length === 0) return []

    // Re-resolve and update each row individually using the full hierarchy.
    for (const row of rows) {
      const newMediaId = this.resolveMediaId(row.songId, row.userId, row.roomId)
      const updateQuery = sql`UPDATE queue SET mediaId = ${newMediaId} WHERE queueId = ${row.queueId}`
      db.run(String(updateQuery), updateQuery.parameters)
    }

    // Return distinct roomIds so callers can emit QUEUE_PUSH to affected rooms.
    return [...new Set(rows.map(r => r.roomId))]
  }

  /**
   * Add a songId to a room's queue.
   *
   * The mediaId to play is resolved immediately via the three-tier preference
   * hierarchy (user > room > global) so that each queue entry carries its own
   * version choice.  Two users queuing the same song in the same room can end
   * up with different mediaIds if they have different personal preferences.
   */
  static add ({ roomId, songId, userId }: { roomId: number, songId: number, userId: number }): void {
    const mediaId = this.resolveMediaId(songId, userId, roomId)

    const fields = new Map()
    fields.set('roomId', roomId)
    fields.set('songId', songId)
    fields.set('userId', userId)
    fields.set('mediaId', mediaId)
    fields.set('prevQueueId', sql`(
      SELECT queueId
      FROM queue
      WHERE roomId = ${roomId} AND queueId NOT IN (
        SELECT prevQueueId
        FROM queue
        WHERE prevQueueId IS NOT NULL AND roomId = ${roomId}
      )
    )`)

    const query = sql`
      INSERT INTO queue ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = db.run(String(query), query.parameters)

    if (res.changes !== 1) {
      throw new Error('Could not add song to queue')
    }
  }

  /**
   * Get queued items for a given room.
   *
   * Now that each queue row stores its own mediaId (resolved at add-time),
   * the query is a simple direct join — no more GROUP BY / MAX(isPreferred)
   * workaround that was silently returning an arbitrary media row.
   */
  static get (roomId: number): { result: number[], entities: Record<number, QueueItem> } {
    const result: number[] = []
    const entities: Record<number, any> = {}
    const map = new Map()
    const pathData = new Map()
    let curQueueId = null

    const query = sql`
      SELECT q.queueId, q.songId, q.userId, q.prevQueueId,
        m.mediaId, m.relPath, m.rgTrackGain, m.rgTrackPeak,
        u.name AS userDisplayName, u.dateUpdated AS userDateUpdated,
        p.pathId, p.data AS pathData
      FROM queue q
        INNER JOIN users u ON q.userId = u.userId
        INNER JOIN media m ON q.mediaId = m.mediaId
        INNER JOIN paths p ON m.pathId = p.pathId
      WHERE q.roomId = ${roomId}
    `
    const rows = db.all<{
      queueId: number
      songId: number
      userId: number
      prevQueueId: number
      mediaId: number
      relPath: string
      rgTrackGain: number
      rgTrackPeak: number
      userDisplayName: string
      userDateUpdated: number
      pathId: number
      pathData: string
    }>(String(query), query.parameters)

    for (const row of rows) {
      if (!pathData.has(row.pathId)) {
        pathData.set(row.pathId, JSON.parse(row.pathData))
      }

      const pathPrefs = pathData.get(row.pathId)?.prefs

      entities[row.queueId] = row
      entities[row.queueId].mediaType = this.getType(row.relPath)
      entities[row.queueId].isVideoKeyingEnabled = !!pathPrefs?.isVideoKeyingEnabled

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].pathData

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
   */
  static move ({ prevQueueId, queueId, roomId }: { prevQueueId: number | null, queueId: number, roomId: number }): void {
    if (queueId === prevQueueId) {
      throw new Error('Invalid prevQueueId')
    }

    if (prevQueueId === -1) prevQueueId = null

    db.exec('BEGIN IMMEDIATE')
    db.exec('PRAGMA defer_foreign_keys = ON')

    try {
      // get the current parent and validate prevQueueId
      const curQuery = sql`
        SELECT q.prevQueueId,
          CASE WHEN ${prevQueueId} IS NULL THEN 1
               WHEN EXISTS (SELECT 1 FROM queue WHERE queueId = ${prevQueueId} AND roomId = ${roomId}) THEN 1
               ELSE 0
          END AS prevValid
        FROM queue q
        WHERE q.queueId = ${queueId} AND q.roomId = ${roomId}
      `
      const curRow = db.get<{ prevQueueId: number | null, prevValid: number }>(String(curQuery), curQuery.parameters)

      if (!curRow) {
        throw new Error(`queueId ${queueId} not found in room ${roomId}`)
      }

      if (!curRow.prevValid) {
        throw new Error(`prevQueueId ${prevQueueId} not found in room ${roomId}`)
      }

      const curParent = curRow.prevQueueId

      // already in correct position?
      if (curParent === prevQueueId) {
        db.exec('COMMIT')
        return
      }

      // perform the move
      const updateQuery = sql`
        UPDATE queue
        SET prevQueueId = CASE
          WHEN prevQueueId = ${queueId} THEN ${curParent}
          WHEN queueId != ${queueId} AND prevQueueId ${prevQueueId === null ? sql`IS NULL` : sql`= ${prevQueueId}`} THEN ${queueId}
          WHEN queueId = ${queueId} THEN ${prevQueueId}
          ELSE prevQueueId
        END
        WHERE roomId = ${roomId} 
          AND (
            prevQueueId = ${queueId} 
            OR (queueId != ${queueId} AND prevQueueId ${prevQueueId === null ? sql`IS NULL` : sql`= ${prevQueueId}`})
            OR queueId = ${queueId}
          )
      `
      db.run(String(updateQuery), updateQuery.parameters)

      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }

  /**
   * Delete a queue item
   */
  static remove (queueId: number): void {
    db.exec('BEGIN IMMEDIATE')
    db.exec('PRAGMA defer_foreign_keys = ON') // v0.9 betas didn't have prevQueueId DEFERRABLE

    try {
      const deleteQuery = sql`
        DELETE FROM queue
        WHERE queueId = ${queueId}
        RETURNING prevQueueId
      `
      const deletedRow = db.get<{ prevQueueId: number | null }>(String(deleteQuery), deleteQuery.parameters)

      if (deletedRow === undefined) {
        throw new Error(`Could not remove queueId: ${queueId}`)
      }

      // close the gap
      const updateQuery = sql`
        UPDATE queue
        SET prevQueueId = ${deletedRow.prevQueueId}
        WHERE prevQueueId = ${queueId}
      `
      db.run(String(updateQuery), updateQuery.parameters)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }

  /**
   * Check if user owns queue item(s)
   */
  static isOwner (userId: number, queueId: number | number[]): boolean {
    const ids = Array.isArray(queueId) ? queueId : [queueId]
    if (ids.length === 0) return false

    const query = sql`
      SELECT COUNT(*) AS count
      FROM queue
      WHERE userId = ${userId} AND queueId IN ${sql.tuple(ids)}
    `
    const res = db.get<{ count: number }>(String(query), query.parameters)
    return res.count === ids.length
  }

  /**
   * Get media type from file extension
   */
  static getType (file: string): string {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

export default Queue
