import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'

const getResult = (state) => ensureState(state.queue).result
const getEntities = (state) => ensureState(state.queue).entities
const getPlayerHistoryJSON = (state) => state.status.historyJSON

const getOrderedResult = createSelector(
  [getResult, getEntities, getPlayerHistoryJSON],
  (result, entities, history) => {
    const ordered = []
    const users = new Set()
    const byUser = {} // queueIds

    history = JSON.parse(history)

    result
      // leave history intact
      .filter(queueId => !history.includes(queueId))
      // create array of queueIds for each user
      .forEach(queueId => {
        const userId = entities[queueId].userId

        if (Array.isArray(byUser[userId])) {
          byUser[userId].push(queueId)
        } else {
          users.add(userId)
          byUser[userId] = [queueId]
        }
      })

    while (users.size) {
      users.forEach(userId => {
        ordered.push(byUser[userId].shift())
        if (!byUser[userId].length) users.delete(userId)
      })
    }

    return [...history, ...ordered]
  }
)

const getOrderedQueue = createSelector(
  [getOrderedResult, getEntities],
  (result, entities) => ({ result, entities })
)

export default getOrderedQueue
