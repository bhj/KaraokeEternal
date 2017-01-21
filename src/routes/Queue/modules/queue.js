// emitted from server
const QUEUE_CHANGE = 'queue/QUEUE_CHANGE'

// add to queue
const QUEUE_ADD = 'server/QUEUE_ADD'

export function queueSong(songId) {
  return {
    type: QUEUE_ADD,
    payload: songId,
    meta: {isOptimistic: true},
  }
}

// remove from queue
export const QUEUE_REMOVE = 'server/QUEUE_REMOVE'

export function removeItem(queueId) {
  return {
    type: QUEUE_REMOVE,
    payload: queueId,
    meta: {isOptimistic: true},
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: (state, {payload}) => {
    // optimistic
    let songIds = state.songIds.slice()
    songIds.push(payload)

    return {
      ...state,
      songIds,
    }
  },
  [QUEUE_REMOVE]: (state, {payload}) => {
    // optimistic
    let result = state.result.slice()
    result.splice(result.indexOf(payload), 1)

    return {
      ...state,
      result,
    }
  },
  [QUEUE_CHANGE]: (state, {payload}) => ({
    ...state,
    result: payload.result,
    entities: payload.entities,
    songIds: payload.result.map(queueId => payload.entities[queueId].songId)
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [],   // item ids
  entities: {}, // keyed by queueId
  songIds: [], // optimistic index for Library lookup
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
