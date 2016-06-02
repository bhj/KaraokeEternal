import 'whatwg-fetch'

let fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

// ------------------------------------
// Get songs by artist
// ------------------------------------
export const GET_SONGS = 'library/GET_SONGS'
export const GET_SONGS_SUCCESS = 'library/GET_SONGS_SUCCESS'
export const GET_SONGS_FAIL = 'library/GET_SONGS_FAIL'

function requestSongs(artistId) {
  return {
    type: GET_SONGS,
    payload: artistId
  }
}

function receiveSongs(response) {
  return {
    type: GET_SONGS_SUCCESS,
    payload: response
  }
}

function songError(message) {
  return {
    type: GET_SONGS_FAIL,
    payload: message
  }
}

export function fetchSongs(artistId) {
  return dispatch => {
    dispatch(requestSongs())

    return fetch('/api/artist/'+artistId, fetchConfig)
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receiveSongs(response))
      })
      .catch(err => {
        dispatch(songError(err))
      })
  }
}

// helper for fetch response
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    return response.text().then((txt) => {
      var error = new Error(txt)
      error.response = response
      throw error
    })
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {

  [GET_SONGS]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [GET_SONGS_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    result: payload.result,
    entities: payload.entities
  }),
  [GET_SONGS_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  isFetching: false,
  errorMessage: null,
  result: [],
  entities: null
}

export default function songsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
