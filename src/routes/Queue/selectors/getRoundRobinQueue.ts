import { RootState } from 'store/store'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import type { QueueItem } from 'shared/types'
import getPlayerHistory from './getPlayerHistory'

const getResult = (state: RootState) => ensureState(state.queue).result
const getEntities = (state: RootState) => ensureState(state.queue).entities
const getQueueId = (state: RootState) => state.status.queueId
const getNextUserId = (state: RootState) => state.status.nextUserId

const getRoundRobinQueue = createSelector(
  [getResult, getEntities, getPlayerHistory, getQueueId, getNextUserId],
  (result, entities, history, curId, nextUserId) => {
    // in case history references non-existent items or queue is still loading
    history = history.filter(queueId => result.includes(queueId))

    // consider current item played (don't re-order it)
    if (entities[curId] && history.lastIndexOf(curId) === -1) {
      history.push(curId)
    }

    // "lock in" next user's item (don't re-order it)
    if (nextUserId !== null) {
      for (const queueId of result) {
        if (!history.includes(queueId) && entities[queueId].isOptimistic !== true && entities[queueId].userId === nextUserId) {
          history.push(queueId)
          break
        }
      }
    }

    const map = new Map()
    const upcoming = []
    const resultByUser = history.map(queueId => (entities[queueId] as QueueItem).userId) // should be no optimistic items

    result.forEach((queueId) => {
      if (history.includes(queueId) // only concerned with upcoming songs
        || entities[queueId].isOptimistic === true // ignore optimistic items
      ) return

      const userId = entities[queueId].userId
      map.set(userId, map.has(userId) ? [...map.get(userId), queueId] : [queueId])
    })

    while (map.size) {
      let max = -1
      let maxUserId

      for (const userId of map.keys()) {
        const idx = resultByUser.lastIndexOf(userId)
        const distance = idx === -1 ? Infinity : resultByUser.length - idx

        if (distance > max) {
          max = distance
          maxUserId = userId
        }
      }

      const userItems = map.get(maxUserId)
      const queueId = userItems.shift()

      if (userItems.length) {
        map.set(maxUserId, userItems)
      } else {
        map.delete(maxUserId)
      }

      resultByUser.push(maxUserId)
      upcoming.push(queueId)
    }

    return {
      result: history.concat(upcoming) as number[],
      entities: entities as Record<number, QueueItem>,
    }
  },
)

export default getRoundRobinQueue
