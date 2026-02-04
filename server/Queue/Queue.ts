import path from 'path'
import { generateKeyBetween } from 'fractional-indexing'
import { db } from '../lib/Database.js'
import sql from 'sqlate'
import { QueueItem } from '../../shared/types.js'

class Queue {
  /**
   * Add a songId to a room's queue
   */
  static add ({ roomId, songId, userId }: { roomId: number, songId: number, userId: number }): void {
    // Get the last position in the queue for this room
    const lastQuery = sql`
      SELECT position
      FROM queue
      WHERE roomId = ${roomId}
      ORDER BY position DESC
      LIMIT 1
    `
    const lastRow = db.get<{ position: string }>(String(lastQuery), lastQuery.parameters)
    const lastPosition = lastRow?.position ?? null

    // Generate a new position after the last item
    const newPosition = generateKeyBetween(lastPosition, null)

    const fields = new Map()
    fields.set('roomId', roomId)
    fields.set('songId', songId)
    fields.set('userId', userId)
    fields.set('position', newPosition)

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
    const result: number[] = []
    const entities: Record<number, any> = {}
    const pathData = new Map()

    const query = sql`
      SELECT queueId, songId, userId, position,
        media.mediaId, media.relPath, media.rgTrackGain, media.rgTrackPeak,
        users.name AS userDisplayName, users.dateUpdated AS userDateUpdated,
        paths.pathId, paths.data AS pathData,
        MAX(isPreferred) AS isPreferred
      FROM queue
        INNER JOIN users USING(userId)
        INNER JOIN media USING(songId)
        INNER JOIN paths USING(pathId)
      WHERE roomId = ${roomId}
      GROUP BY queueId
      ORDER BY position ASC
    `
    const rows = db.all<{
      queueId: number
      songId: number
      userId: number
      position: string
      mediaId: number
      relPath: string
      rgTrackGain: number
      rgTrackPeak: number
      userDisplayName: string
      userDateUpdated: number
      pathId: number
      pathData: string
      isPreferred: number
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
      delete entities[row.queueId].isPreferred
      delete entities[row.queueId].pathData
      delete entities[row.queueId].position

      result.push(row.queueId)
    }

    return { result, entities }
  }

  /**
   * Move a queue item to a new position
   * prevQueueId: -1 means move to beginning, otherwise the queueId after which to insert
   */
  static move ({ prevQueueId, queueId, roomId }: { prevQueueId: number | null, queueId: number, roomId: number }): void {
    if (queueId === prevQueueId) {
      throw new Error('Invalid prevQueueId')
    }

    // Get all positions in the room ordered
    const positionsQuery = sql`
      SELECT queueId, position
      FROM queue
      WHERE roomId = ${roomId}
      ORDER BY position ASC
    `
    const rows = db.all<{ queueId: number, position: string }>(String(positionsQuery), positionsQuery.parameters)

    // Find the positions we need
    let beforePosition: string | null = null
    let afterPosition: string | null = null

    if (prevQueueId === -1 || prevQueueId === null) {
      // Move to beginning
      afterPosition = rows.length > 0 ? rows[0].position : null
      // Skip the item being moved if it's already first
      if (rows.length > 0 && rows[0].queueId === queueId && rows.length > 1) {
        afterPosition = rows[1].position
      }
    } else {
      // Find the position after prevQueueId
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].queueId === prevQueueId) {
          beforePosition = rows[i].position
          // Find the next item that isn't the one being moved
          for (let j = i + 1; j < rows.length; j++) {
            if (rows[j].queueId !== queueId) {
              afterPosition = rows[j].position
              break
            }
          }
          break
        }
      }
    }

    // Generate new position between before and after
    const newPosition = generateKeyBetween(beforePosition, afterPosition)

    // Update the position
    const updateQuery = sql`
      UPDATE queue
      SET position = ${newPosition}
      WHERE queueId = ${queueId} AND roomId = ${roomId}
    `
    db.run(String(updateQuery), updateQuery.parameters)
  }

  /**
   * Delete a queue item
   * With fractional indexing, we simply delete the item - no need to update other positions
   */
  static remove (queueId: number): void {
    const deleteQuery = sql`
      DELETE FROM queue
      WHERE queueId = ${queueId}
    `
    const res = db.run(String(deleteQuery), deleteQuery.parameters)

    if (!res.changes) {
      throw new Error(`Could not remove queueId: ${queueId}`)
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
    return res!.count === ids.length
  }

  /**
   * Get media type from file extension
   */
  static getType (file: string): string {
    return /\.mp4/i.test(path.extname(file)) ? 'mp4' : 'cdg'
  }
}

export default Queue
