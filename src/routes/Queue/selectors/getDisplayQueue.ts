import { RootState } from 'store/store'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import type { QueueItem } from 'shared/types'
import { getQueueHistory, getUpcomingByUser } from './getRoundRobinQueue'
import getPendingQueue, { type PendingQueueItem } from './getPendingQueue'
import roundRobin from './roundRobin'

// only read for history and upcoming items, which are never optimistic
const getEntities = (state: RootState) => ensureState(state.queue).entities as Record<number, QueueItem>
const getNextUserId = (state: RootState) => state.status.nextUserId

interface QueueRow {
  kind: 'queue'
  key: string
  userId: number
  queueId: number
}

interface PendingRow {
  kind: 'pending'
  key: string
  userId: number
  item: PendingQueueItem
}

export type DisplayRow = QueueRow | PendingRow

// The queue as shown: the round-robin queue with each in-flight provider song
// in the turn it would take once ingested. Ingest appends to the queue, so a
// singer's pending songs follow their queued ones. Display only; the player
// uses getRoundRobinQueue, so a song that isn't ready by its turn just slips.
const getDisplayQueue = createSelector(
  [getEntities, getQueueHistory, getUpcomingByUser, getPendingQueue, getNextUserId],
  (entities, { history, lockedQueueId }, upcomingByUser, pending, nextUserId): DisplayRow[] => {
    const queueRow = (queueId: number): DisplayRow => ({ kind: 'queue', key: String(queueId), userId: entities[queueId].userId, queueId })

    const prefix = history.map(queueRow)
    const playedUserIds = history.map(queueId => entities[queueId].userId)
    const lists = new Map<number, DisplayRow[]>()
    const errored: DisplayRow[] = []

    for (const [userId, queueIds] of upcomingByUser) {
      lists.set(userId, queueIds.map(queueRow))
    }

    for (const item of pending) {
      const row: DisplayRow = { kind: 'pending', key: item.key, userId: item.userId, item }

      if (item.status === 'error') {
        errored.push(row)
        continue
      }

      // The next user is locked in but has no queued item left (it was
      // removed), so their pending song would be locked in once ingested
      if (lockedQueueId === null && item.userId === nextUserId && !prefix.some(r => r.kind === 'pending')) {
        prefix.push(row)
        playedUserIds.push(item.userId)
        continue
      }

      const list = lists.get(item.userId)
      if (list) list.push(row)
      else lists.set(item.userId, [row])
    }

    return [...prefix, ...roundRobin(lists, playedUserIds), ...errored]
  },
)

export default getDisplayQueue
