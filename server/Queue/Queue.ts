import path from 'path'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import sql from 'sqlate'
import { QueueItem } from '../../shared/types.js'

const log = getLogger('Queue')

interface QueueEntityBuilding {
  queueId: number
  songId: number
  userId: number
  prevQueueId: number | null
  mediaId: number | null
  relPath?: string | null
  rgTrackGain: number | null
  rgTrackPeak: number | null
  userDisplayName: string
  userDateUpdated: number
  pathId: number | null
  pathData?: string | null
  isPreferred?: number | null
  mediaType?: 'cdg' | 'mp4'
  isVideoKeyingEnabled?: boolean
}

class Queue {
  /**
   * Add a songId to a room's queue
   */
  static add ({ roomId, songId, userId }: { roomId: number, songId: number, userId: number }): void {
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
   * Get queued items for a given room
   */
  static get (roomId: number): { result: number[], entities: Record<number, QueueItem> } {
    const chain: number[] = []
    const orphaned = new Set<number>()
    const entities: Record<number, QueueEntityBuilding> = {}
    const map = new Map()
    const pathData = new Map()
    let curQueueId = null

    // media and paths are LEFT JOINed so that queue items whose media was
    // removed (e.g. mid-scan) still anchor the prevQueueId chain; they're
    // kept out of the payload below
    const query = sql`
      SELECT queueId, songId, userId, prevQueueId,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated AS userDateUpdated,
        paths.pathId, paths.data AS pathData,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        LEFT JOIN media USING(songId)
        LEFT JOIN paths USING(pathId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY queueId
    `
    const rows = db.all<{
      queueId: number
      songId: number
      userId: number
      prevQueueId: number
      mediaId: number | null
      relPath: string | null
      rgTrackGain: number | null
      rgTrackPeak: number | null
      userDisplayName: string
      userDateUpdated: number
      pathId: number | null
      pathData: string | null
      isPreferred: number | null
    }>(String(query), query.parameters)

    for (const row of rows) {
      // every row participates in the chain, orphaned or not
      if (row.prevQueueId === null) {
        // found the first item
        chain.push(row.queueId)
        curQueueId = row.queueId
      } else {
        // map indexed by prevQueueId
        map.set(row.prevQueueId, row.queueId)
      }

      const { relPath, pathId } = row

      if (row.mediaId === null || relPath === null || pathId === null) {
        orphaned.add(row.queueId)
        continue
      }

      if (!pathData.has(pathId)) {
        pathData.set(pathId, row.pathData === null ? null : JSON.parse(row.pathData))
      }

      const pathPrefs = pathData.get(pathId)?.prefs

      entities[row.queueId] = row
      entities[row.queueId].mediaType = this.getType(relPath)
      entities[row.queueId].isVideoKeyingEnabled = !!pathPrefs?.isVideoKeyingEnabled

      // don't send over the wire
      delete entities[row.queueId].relPath
      delete entities[row.queueId].isPreferred
      delete entities[row.queueId].pathData
    }

    while (chain.length < rows.length) {
      // get the item whose prevQueueId references the current one
      const nextQueueId = map.get(curQueueId)

      if (nextQueueId === undefined) {
        log.error('queue chain broken in room %s at queueId %s', roomId, curQueueId)

        // degrade to insertion order for the unreachable remainder
        for (const row of rows) {
          if (!chain.includes(row.queueId)) chain.push(row.queueId)
        }

        break
      }

      chain.push(nextQueueId)
      curQueueId = nextQueueId
    }

    const result = chain.filter(queueId => !orphaned.has(queueId))
    return { result, entities: entities as unknown as Record<number, QueueItem> }
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
  static getType (file: string): 'cdg' | 'mp4' {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

export default Queue
