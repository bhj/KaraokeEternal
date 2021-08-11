import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'

const getResult = (state) => ensureState(state.queue).result
const getEntities = (state) => ensureState(state.queue).entities
const getPlayerQueueId = (state) => state.status.queueId
const getPlayerHistoryJSON = (state) => state.status.historyJSON

const getPlayerHistory = createSelector(
  [getResult, getPlayerHistoryJSON, getPlayerQueueId],
  (result, historyJSON, curId) => {
    const history = JSON.parse(historyJSON)
    if (curId !== -1) history.push(curId)

    // queue may not have been pushed yet
    return history.filter(queueId => result.includes(queueId))
  })

const getOrderedResult = createSelector(
  [getResult, getEntities, getPlayerHistory],
  (result, entities, history) => {
    // map queueIds to userIds
    const resultByUser = []
    const historyByUser = history.map(queueId => entities[queueId].userId)

    result = result.filter(queueId => {
      if (history.includes(queueId)) return false
      if (entities[queueId].youtubeVideoId && entities[queueId].youtubeVideoStatus !== 'ready') return false

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

    return history
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

const getReadyQueue = createSelector(
  [getOrderedResult, getEntities],
  (result, entities) => ({ result, entities })
)

export default getReadyQueue
