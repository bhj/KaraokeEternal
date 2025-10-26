import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'
import { ensureState } from 'redux-optimistic-ui'

const getQueue = (state: RootState) => ensureState(state.queue)
const getCurrentQueueId = (state: RootState) => state.status.queueId
const getPlayerHistoryJSON = (state: RootState) => state.status.historyJSON

const getUpcomingSongs = createSelector(
  [getQueue, getCurrentQueueId, getPlayerHistoryJSON],
  (queue, curId, historyJSON) => {
    const history = JSON.parse(historyJSON)

    // not (re)ordering since it doesn't currently matter in library view
    return queue.result
      .filter(queueId => !history.includes(queueId))
      .map(queueId => queue.entities[queueId].songId)
  },
)

export default getUpcomingSongs
