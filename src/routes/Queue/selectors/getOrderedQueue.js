import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'

const getResult = (state) => ensureState(state.queue).result
const getEntities = (state) => ensureState(state.queue).entities

const getOrderedQueue = createSelector(
  [getResult, getEntities],
  (result, entities) => {
    const map = new Map()
    const orderedResult = []
    let curQueueId = null

    // ignore optimistic items
    result = result.filter(queueId => !entities[queueId].isOptimistic)

    // create map indexed by prevQueueId
    result.forEach(queueId => {
      if (entities[queueId].prevQueueId === null) {
        // found the first item
        orderedResult.push(queueId)
        curQueueId = queueId
      } else {
        map.set(entities[queueId].prevQueueId, queueId)
      }
    })

    while (orderedResult.length < result.length) {
      // get the item whose prevQueueId references the current one
      const nextQueueId = entities[map.get(curQueueId)].queueId
      orderedResult.push(nextQueueId)
      curQueueId = nextQueueId
    }

    return {
      result: orderedResult,
      entities,
    }
  }
)

export default getOrderedQueue
