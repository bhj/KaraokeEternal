import 'whatwg-fetch'

let fetchConfig = {
  credentials: 'same-origin',
  headers: new Headers({
    'Content-Type': 'application/json'
  })
}

// ------------------------------------
// Get artists
// ------------------------------------
export const GET_ARTISTS = 'library/GET_ARTISTS'
export const GET_ARTISTS_SUCCESS = 'library/GET_ARTISTS_SUCCESS'
export const GET_ARTISTS_FAIL = 'library/GET_ARTISTS_FAIL'

function requestArtists() {
  return {
    type: GET_ARTISTS,
    payload: null
  }
}

function receiveArtists(response) {
  return {
    type: GET_ARTISTS_SUCCESS,
    payload: response
  }
}

function artistError(message) {
  return {
    type: GET_ARTISTS_FAIL,
    payload: message
  }
}

export function fetchArtists() {
  return dispatch => {
    dispatch(requestArtists())

    return fetch('/api/artists', fetchConfig)
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receiveArtists(response))
      })
      .catch(err => {
        dispatch(artistError(err))
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
  [GET_ARTISTS]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [GET_ARTISTS_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    artists: payload,
    errorMessage: null
  }),
  [GET_ARTISTS_FAIL]: (state, {payload}) => ({
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
  artists: null
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
