import { RootState } from 'store/store'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import getPlayerHistory from './getPlayerHistory'

const getResult = (state: RootState) => ensureState(state.queue).result
const getEntities = (state: RootState) => ensureState(state.queue).entities
const getQueueId = (state: RootState) => state.status.queueId

const getUpcoming = createSelector(
  [
    getResult,
    getEntities,
    getPlayerHistory,
    getQueueId,
    (_: RootState, userId: number) => userId,
  ],
  (result, entities, history, curId, userId) => {
    return result.filter((qId) => {
      const item = entities[qId]
      return item.isOptimistic !== true && item.userId === userId && qId !== curId && !history.includes(qId)
    })
  },
)

export default getUpcoming
