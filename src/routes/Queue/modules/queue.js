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
const PLAYER_NEXT = 'player/PLAYER_NEXT'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

// ------------------------------------
// add to queue
// ------------------------------------
const QUEUE_ADD = 'server/QUEUE_ADD'

export function addSong(songId) {
  return {
    type: QUEUE_ADD,
    payload: songId
  }
}

// ------------------------------------
// remove from queue
// ------------------------------------
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
  // broadcast to room
  [PLAYER_STATUS]: (state, {payload}) => {
     // @todo: ignore (old) updates for previous queueId
    return {
      ...state,
      curId: payload.curId,
      curPos: payload.curPos,
      isPlaying: payload.isPlaying,
    }
  },
  [PLAYER_NEXT]: (state, {payload}) => ({
    ...state,
    curId: payload,
    curPos: 0,
    isFinished: false,
  }),
  [PLAYER_QUEUE_END]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
    isFinished: true,
  }),
  [PLAYER_ERROR]: (state, {payload}) => {
    // can be multiple errors for a media item
    const {queueId, message} = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(message) : [message]
      }
    }
  },
  // [QUEUE_ADD]: (state, {payload}) => ({
  //   ...state,
  //   result: state.result.push()
  // }),
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
  entities: {}, // keyed by queueId
  errors: {},   // object of arrays keyed by queueId
  curId: null,
  curPos: 0,
  isPlaying: false,
  isFinished: false,
  errorMessage: null,
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
