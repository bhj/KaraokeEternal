import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'

const getResult = (state) => ensureState(state).result
const getEntities = (state) => ensureState(state).entities

const getOrderedResult = createSelector(
  [getResult, getEntities],
  (result, entities) => {
    const res = []
    const users = new Set()
    const byUser = {} // queueIds

    // create array of queueIds for each user
    result.forEach(queueId => {
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
        res.push(byUser[userId].shift())
        if (!byUser[userId].length) users.delete(userId)
      })
    }

    return res
  }
)

const getOrderedQueue = createSelector(
  [getOrderedResult, getEntities],
  (result, entities) => ({ result, entities })
)

export default getOrderedQueue
