import { requestPlayNext } from '../../Queue/modules/queue'

const PLAYER_NEXT = 'player/PLAYER_NEXT'
const PLAYER_PLAY = 'player/PLAYER_PLAY'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'
const PLAYER_STATUS = 'player/PLAYER_STATUS'

// can be emitted after a PLAYER_NEXT_REQUEST
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

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

// signals we should move to next song
export const MEDIA_END = 'player/MEDIA_END'

export function mediaEnd() {
  return (dispatch, getState) => {
    const curId = getState().player.currentId

    dispatch({
      type: MEDIA_END,
      payload: curId
    })

    dispatch(requestPlayNext(curId))
  }
}

// general error; we should move to next song
export const MEDIA_ERROR = 'player/MEDIA_ERROR'

export function mediaError(id, message) {
  return {
    type: MEDIA_ERROR,
    payload: {id, message}
  }
}

// Tell server to emit player status to room
const PLAYER_EMIT_STATUS = 'server/PLAYER_EMIT_STATUS'
export function status(s) {
  return {
    type: PLAYER_EMIT_STATUS,
    payload: s
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_EMIT_STATUS]: (state, {payload}) => ({
    ...state,
    isPlaying: payload.isPlaying,
    currentId: payload.currentId,
    currentTime: payload.currentTime,
    duration: payload.duration,
  }),
  [PLAYER_NEXT]: (state, {payload}) => ({
    ...state,
    currentId: payload,
  }),
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
  [MEDIA_ERROR]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  currentId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isFetching: false,
  errorMessage: null
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
