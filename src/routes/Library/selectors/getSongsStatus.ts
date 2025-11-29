import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'
import { ensureState } from 'redux-optimistic-ui'

const getQueue = (state: RootState) => ensureState(state.queue)
const getCurrentQueueId = (state: RootState) => state.status.queueId
const getPlayerHistoryJSON = (state: RootState) => state.status.historyJSON

const getSongsStatus = createSelector(
  [getQueue, getCurrentQueueId, getPlayerHistoryJSON],
  (queue, curId, historyJSON) => {
    const history = JSON.parse(historyJSON)
    const playedSongs: number[] = []
    const upcomingSongs: number[] = []

    queue.result.forEach((queueId) => {
      if (history.includes(queueId)) {
        playedSongs.push(queue.entities[queueId].songId)
      } else if (queueId !== curId) {
        upcomingSongs.push(queue.entities[queueId].songId)
      }
    })

    return { playedSongs, upcomingSongs }
  },
)

export default getSongsStatus
