import {
  QUEUE_ADD,
  QUEUE_UPDATE,
  QUEUE_REMOVE,
  PLAYER_STATUS,
} from 'actions'

// add to queue
export function queueSong (mediaId) {
  return {
    type: QUEUE_ADD,
    payload: mediaId,
  }
}

// remove from queue
export function removeItem (queueId) {
  return {
    type: QUEUE_REMOVE,
    payload: queueId,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_UPDATE]: (state, { payload }) => ({
    ...state,
    result: payload.result,
    entities: setWaits(payload, state.curId, state.curPos),
  }),
  [PLAYER_STATUS]: (state, { payload }) => {
    const { queueId, position } = payload

    return {
      ...state,
      curId: queueId,
      curPos: position,
      entities: setWaits(state, queueId, position),
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [], // item ids
  entities: {}, // keyed by queueId
  // these are siphoned off of player status
  // because we need to calculate wait times
  curId: -1,
  curPos: 0,
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}

// calculates and adds the wait (in sec) property
// to each entity. @todo this is hacky
function setWaits (payload, curId, curPos) {
  const { result, entities } = payload
  let newItems = Object.assign({}, entities)

  let wait = 0
  let nextWait = 0

  result.forEach(i => {
    const duration = entities[i].duration
    if (i === curId) {
      // currently playing
      nextWait = Math.round(duration - curPos)
    } else if (i > curId) {
      wait += nextWait
      nextWait = duration
    }

    newItems[i].wait = wait
  })

  return newItems
}
