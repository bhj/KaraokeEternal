// Request Play
const PLAYER_PLAY_REQUEST = 'server/PLAYER_PLAY'
export function requestPlay() {
  return {
    type: PLAYER_PLAY_REQUEST,
    payload: null
  }
}

// Request Pause
const PLAYER_PAUSE_REQUEST = 'server/PLAYER_PAUSE'
export function requestPause() {
  return {
    type: PLAYER_PAUSE_REQUEST,
    payload: null
  }
}

// emitted from server
const QUEUE_CHANGE = 'queue/QUEUE_CHANGE'
const QUEUE_ERROR = 'queue/QUEUE_ERROR'
const PLAYER_STATUS = 'player/PLAYER_STATUS'
const PLAYER_ERROR = 'player/PLAYER_ERROR'

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
  // broadcast to room
  [PLAYER_STATUS]: (state, {payload}) => ({
    ...state,
    status: payload,
  }),
  [PLAYER_ERROR]: (state, {payload}) => {
    // can be multiple errors for a media item
    const {id, message} = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        [id]: state.errors[id] ? state.errors[id].concat(message) : [message]
      }
    }
  },
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
  result: [],   // item ids
  entities: {}, // keyed by item id
  errors: {},   // object of arrays keyed by item id
  status: {},   // player status
  errorMessage: null,
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
