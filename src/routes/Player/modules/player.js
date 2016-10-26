import { ensureState } from 'redux-optimistic-ui'

const PLAYER_PLAY = 'player/PLAYER_PLAY'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'
const PLAYER_STATUS = 'player/PLAYER_STATUS'
const PLAYER_NEXT = 'player/PLAYER_NEXT'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'
const PLAYER_MEDIA_ERROR = 'player/PLAYER_MEDIA_ERROR'
// for informational purposes from provider players
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'


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

// Request Play Next
const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
export function requestPlayNext() {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_NEXT_REQUEST,
      payload: ensureState(getState()).player.queueId
    })
  }
}

export function getMedia(url) {
  return {
    type: GET_MEDIA,
    payload: url
  }
}

export function getMediaSuccess() {
  return {
    type: GET_MEDIA_SUCCESS,
    payload: null
  }
}

const PLAYER_EMIT_MEDIA_ERROR = 'server/PLAYER_EMIT_MEDIA_ERROR'
export function mediaError(queueId, message) {
  return {
    type: PLAYER_EMIT_MEDIA_ERROR,
    payload: { queueId, message }
  }
}

// have server emit player status to room
const PLAYER_EMIT_STATUS = 'server/PLAYER_EMIT_STATUS'
export function emitStatus(payload) {
  return {
    type: PLAYER_EMIT_STATUS,
    payload,
    meta: {throttle: true}
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_PAUSE]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
  }),
  [PLAYER_PLAY]: (state, {payload}) => ({
    ...state,
    isPlaying: true,
  }),
  [PLAYER_NEXT]: (state, {payload}) => ({
    ...state,
    queueId: payload,
    pos: 0,
    isFinished: false,
  }),
  [PLAYER_QUEUE_END]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
    isFinished: true,
  }),
  [GET_MEDIA]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [GET_MEDIA_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    isPlaying: true, // all media is loaded
  }),
  [PLAYER_EMIT_MEDIA_ERROR]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
    isFetching: false,
  }),
  // broadcast to room
  [PLAYER_STATUS]: (state, {payload}) => {
     // @todo: ignore (old) updates for previous queueId
    return {
      ...state,
      queueId: payload.queueId,
      pos: payload.pos,
      isPlaying: payload.isPlaying,
    }
  },
  [PLAYER_MEDIA_ERROR]: (state, {payload}) => {
    const {queueId, message} = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        // can be multiple errors for a media item
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(message) : [message]
      }
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isPlaying: false,
  isFetching: false,
  isFinished: false,
  queueId: -1,
  pos: 0,
  errors: {},   // object of arrays keyed by queueId
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
