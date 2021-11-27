import { createSelector } from 'reselect'
import getRoundRobinQueue from './getRoundRobinQueue'

const getPosition = (state) => state.status.position
const getQueue = (state) => getRoundRobinQueue(state)
const getQueueId = (state) => state.status.queueId
const getSongs = (state) => state.songs

const getWaits = createSelector(
  [getQueue, getQueueId, getPosition, getSongs],
  (queue, queueId, position, songs) => {
    const curIdx = queue.result.indexOf(queueId)
    const waits = {}
    let curWait = 0
    let nextWait = 0

    queue.result.forEach((queueId, i) => {
      const songId = queue.entities[queueId].songId
      if (!songs.entities[songId]) return

      if (i === curIdx) {
        // currently playing
        nextWait = Math.round(songs.entities[songId].duration - position)
      } else if (i > curIdx) {
        // upcoming
        curWait += nextWait
        nextWait = songs.entities[songId].duration
      }

      waits[queueId] = curWait
    })

    return waits
  }
)

export default getWaits
