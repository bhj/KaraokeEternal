// Request Play Next
const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
export function requestPlayNext(curId) {
  return {
    type: PLAYER_NEXT_REQUEST,
    payload: curId
  }
}

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
    isPlaying: payload.isPlaying,
    currentId: payload.currentId,
    currentTime: payload.currentTime,
    duration: payload.duration,
  }),
  [QUEUE_CHANGE]: (state, {payload}) => ({
    ...state,
    result: payload.result,
    entities: payload.entities
  }),
  [QUEUE_ERROR]: (state, {payload}) => ({
    ...state,
    errorMessage: payload.message
  }),
  [PLAYER_ERROR]: (state, {payload}) => ({
    ...state,
    errors: {
      ...state.errors,
      [payload.id]: payload.message
    }
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: {queueIds: [], uids: []},
  entities: {},
  isPlaying: false,
  currentId: null,
  currentTime: 0,
  duration: 0,
  errorMessage: null,
  errors: {}, // keyed on queueId
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
