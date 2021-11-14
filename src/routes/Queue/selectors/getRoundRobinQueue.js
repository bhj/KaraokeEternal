import { createSelector } from 'reselect'
import getPlayerHistory from './getPlayerHistory'
import getOrderedQueue from './getOrderedQueue'

const getQueueId = (state) => state.status.queueId

const getRoundRobinQueue = createSelector(
  [getOrderedQueue, getPlayerHistory, getQueueId],
  ({ result, entities }, history, curId) => {
    // consider the current item played
    if (curId !== -1) history.push(curId)

    // in case queue hasn't been pushed yet,
    // or history references non-existent items
    history = history.filter(queueId => result.includes(queueId))

    // map queueIds to userIds
    const resultByUser = []
    const historyByUser = history.map(queueId => entities[queueId].userId)

    result = result.filter(queueId => {
      if (history.includes(queueId)) return false

      resultByUser.push(entities[queueId].userId)
      return true
    })

    while (result.length) {
      const userId = getNextUser(resultByUser, historyByUser)
      const idx = resultByUser.indexOf(userId)
      const nextQueueId = result.splice(idx, 1)[0]
      resultByUser.splice(idx, 1)

      history.push(nextQueueId)
      historyByUser.push(userId)
    }

    return {
      result: history,
      entities,
    }
  }
)

// whose turn is it?
function getNextUser (resultByUser, historyByUser) {
  const users = Array.from(new Set(resultByUser))
  const waits = []

  users.forEach(userId => {
    const idx = historyByUser.lastIndexOf(userId)
    waits.push(idx === -1 ? Infinity : historyByUser.length - idx)
  })

  const waitIdx = waits.indexOf(Math.max(...waits))
  return users[waitIdx]
}

export default getRoundRobinQueue
