// ------------------------------------
// dispatched mostly for informational purposes
// by provider players
// ------------------------------------
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'
export const GET_MEDIA_FAIL = 'player/GET_MEDIA_FAIL'

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

export function getMediaError(message) {
  return {
    type: GET_MEDIA_FAIL,
    payload: message
  }
}

// ------------------------------------
// Constants
// ------------------------------------
export const PLAY = 'player/PLAY'
export const PAUSE = 'player/PAUSE'
export const END = 'player/END'

// ------------------------------------
// Actions
// ------------------------------------
export const play = () => {
  return {
    type: PLAY,
    payload: null
  }
}

export const pause = () => {
  return {
    type: PAUSE,
    payload: null
  }
}

export const end = () => ({
  type: END,
  payload: null // current audio id?
})

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAY]: (state, {payload}) => ({
    ...state,
    isPlaying: true
  }),
  [PAUSE]: (state, {payload}) => ({
    ...state,
    isPlaying: false
  }),
  [END]: (state, {payload}) => ({
    ...state,
    isPlaying: false
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
  [GET_MEDIA_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isFetching: false,
  isPlaying: false,
  errorMessage: null
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type];

  return handler ? handler(state, action) : state;
}
