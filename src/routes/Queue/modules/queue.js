// emitted from server
const QUEUE_CHANGE = 'queue/QUEUE_CHANGE'
const QUEUE_ERROR = 'queue/QUEUE_ERROR'

// ------------------------------------
// add to queue
// ------------------------------------
const QUEUE_ADD = 'server/QUEUE_ADD'

export function addSong(uid) {
  return {
    type: QUEUE_ADD,
    payload: uid
  }
}

// ------------------------------------
// remove from queue
// ------------------------------------
export const QUEUE_REMOVE = 'server/QUEUE_REMOVE'

export function removeItem(id) {
  return {
    type: QUEUE_REMOVE,
    payload: id
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_CHANGE]: (state, {payload}) => ({
    ...state,
    result: payload.result,
    entities: payload.entities
  }),
  [QUEUE_ERROR]: (state, {payload}) => ({
    ...state,
    errorMessage: payload.message
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  errorMessage: null,
  result: {queueIds: [], uids: []},
  entities: {}
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
