import 'whatwg-fetch'

let fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

// ------------------------------------
// Search library
// ------------------------------------
export const SEARCH_LIBRARY = 'library/SEARCH_LIBRARY'
export const SEARCH_LIBRARY_SUCCESS = 'library/SEARCH_LIBRARY_SUCCESS'
export const SEARCH_LIBRARY_FAIL = 'library/SEARCH_LIBRARY_FAIL'

function requestSearch(query) {
  return {
    type: SEARCH_LIBRARY,
    payload: query
  }
}

function receiveSearch(response) {
  return {
    type: SEARCH_LIBRARY_SUCCESS,
    payload: response
  }
}

function searchError(message) {
  return {
    type: SEARCH_LIBRARY_FAIL,
    payload: message
  }
}

export function doSearch(query) {
  return dispatch => {
    dispatch(requestSearch(query))

    return fetch('/api/search', {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify({query})
      })
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receiveSearch(response))
      })
      .catch(err => {
        dispatch(searchError(err))
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

  [SEARCH_LIBRARY]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    query: payload,
    errorMessage: null
  }),
  [SEARCH_LIBRARY_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    result: payload.result,
    entities: payload.entities
  }),
  [SEARCH_LIBRARY_FAIL]: (state, {payload}) => ({
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
  query: '',
  result: [],
  entities: null
}

export default function searchReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
