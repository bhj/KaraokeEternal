import fetch from 'isomorphic-fetch'

let fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

// ------------------------------------
// Get full library
// ------------------------------------
export const GET_LIBRARY = 'library/GET_LIBRARY'
export const GET_LIBRARY_SUCCESS = 'library/GET_LIBRARY_SUCCESS'
export const GET_LIBRARY_FAIL = 'library/GET_LIBRARY_FAIL'

function requestLibrary() {
  return {
    type: GET_LIBRARY,
    payload: null
  }
}

function receiveLibrary(response) {
  return {
    type: GET_LIBRARY_SUCCESS,
    payload: response
  }
}

function libraryError(message) {
  return {
    type: GET_LIBRARY_FAIL,
    payload: null,
    error: message,
  }
}

export function fetchLibrary() {
  return dispatch => {
    dispatch(requestLibrary())

    return fetch('/api/library', fetchConfig)
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receiveLibrary(response))
      })
      .catch(err => {
        dispatch(libraryError(err.message))
      })
  }
}

export const SCROLL_ARTISTS = 'library/SCROLL_ARTISTS'
export function scrollArtists(scrollTop) {
  return {
    type: SCROLL_ARTISTS,
    payload: scrollTop,
    meta: {throttle: true},
  }
}

export const ARTIST_EXPAND_TOGGLE = 'library/ARTIST_EXPAND_TOGGLE'
export function toggleArtistExpanded(artistId) {
  return {
    type: ARTIST_EXPAND_TOGGLE,
    payload: artistId,
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
  [GET_LIBRARY]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [GET_LIBRARY_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    artists: payload.artists,
    songs: payload.songs
  }),
  [GET_LIBRARY_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [SCROLL_ARTISTS]: (state, {payload}) => ({
    ...state,
    scrollTop: payload,
  }),
  [ARTIST_EXPAND_TOGGLE]: (state, {payload}) => {
    let expandedArtists = state.expandedArtists.slice()
    const i = expandedArtists.indexOf(payload)

    if (i === -1) {
      expandedArtists.push(payload)
    } else {
      expandedArtists.splice(i, 1)
    }

    return {
      ...state,
      expandedArtists,
    }
  }
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  artists: {result: [], entities:{}},
  songs: {result: [], entities:{}},
  isFetching: false,
  scrollTop: 0,
  expandedArtists: [],
}

export default function artistsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
