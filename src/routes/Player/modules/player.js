const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
const PLAYER_NEXT = 'player/PLAYER_NEXT'

const PLAYER_PLAY_REQUEST = 'server/PLAYER_PLAY'
const PLAYER_PLAY = 'player/PLAYER_PLAY'
const PLAYER_PAUSE_REQUEST = 'server/PLAYER_PAUSE'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'
const PLAYER_VOLUME_REQUEST = 'server/PLAYER_VOLUME'
const PLAYER_VOLUME = 'player/PLAYER_VOLUME'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

const EMIT_STATUS = 'server/PLAYER_STATUS'
const EMIT_ERROR = 'server/PLAYER_ERROR'
const PLAYBACK_ERROR = 'status/PLAYBACK_ERROR'

// for informational purposes from provider players
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'

// Request Play
export function requestPlay() {
  return {
    type: PLAYER_PLAY_REQUEST,
    payload: null
  }
}

// Request Pause
export function requestPause() {
  return {
    type: PLAYER_PAUSE_REQUEST,
    payload: null
  }
}

// Request Pause
export function requestVolume(vol) {
  return {
    type: PLAYER_VOLUME_REQUEST,
    payload: vol,
    meta: {
      throttle: {
        wait: 200,
        leading: false,
      }
    },
  }
}

// Request Play Next
export function requestPlayNext() {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_NEXT_REQUEST,
      payload: getState().status.queueId
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

// have server emit player status to room
export function emitStatus(payload) {
  return {
    type: EMIT_STATUS,
    payload,
    meta: {throttle: true}
  }
}

// have server emit error to room
export function emitError(queueId, message) {
  return {
    type: EMIT_ERROR,
    payload: { queueId, message }
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
  [PLAYER_VOLUME]: (state, {payload}) => ({
    ...state,
    volume: payload,
  }),
  [PLAYER_NEXT]: (state, {payload}) => {
    return {
      ...state,
      queueId: payload,
      isPlaying: true,
      isAtQueueEnd: false,
    }
  },
  [PLAYER_QUEUE_END]: (state, {payload}) => ({
    ...state,
    isAtQueueEnd: true,
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
  [EMIT_ERROR]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
    isFetching: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  queueId: -1,
  volume: 1,
  isPlaying: false,
  isFetching: false,
  isAtQueueEnd: false,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
