import { ensureState } from 'redux-optimistic-ui'

const PLAYER_PLAY = 'player/PLAYER_PLAY'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'
const PLAYER_STATUS = 'player/PLAYER_STATUS'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

// Request Play Next
const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
export function requestPlayNext() {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_NEXT_REQUEST,
      payload: ensureState(getState()).queue.curId
    })
  }
}

// ------------------------------------
// dispatched mostly for informational purposes
// by provider players
// ------------------------------------
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'

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
    payload
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
  [PLAYER_QUEUE_END]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
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
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isPlaying: false,
  isFetching: false,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
