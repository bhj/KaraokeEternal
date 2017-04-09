import {
  QUEUE_ADD,
  QUEUE_UPDATE,
  QUEUE_REMOVE,
  PLAYBACK_STATUS,
} from 'constants'

// add to queue
export function queueSong (songId) {
  return {
    type: QUEUE_ADD,
    payload: songId,
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
    entities: setWaits(payload.result, payload.entities, state.curId, state.curPos),
    songIds: payload.result.map(queueId => payload.entities[queueId].songId)
  }),
  [PLAYBACK_STATUS]: (state, { payload }) => {
    const { queueId, position } = payload

    return {
      ...state,
      curId: queueId,
      curPos: position,
      entities: setWaits(state.result, state.entities, queueId, position),
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [],   // item ids
  entities: {}, // keyed by queueId
  songIds: [], // optimistic index for Library lookup
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
function setWaits (result, entities, curId, curPos) {
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
