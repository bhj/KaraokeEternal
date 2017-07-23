import {
  PATHS_REQUEST,
  PATHS_RECEIVE,
  PATH_ADD,
  PATH_REMOVE,
  PATH_CHOOSER_OPEN,
  PATH_CHOOSER_CLOSE,
} from 'constants'

// ------------------------------------
// Actions
// ------------------------------------
function requestPaths () {
  return {
    type: PATHS_REQUEST,
    payload: null
  }
}

function receivePaths (response) {
  return {
    type: PATHS_RECEIVE,
    payload: response
  }
}

function pathsError (message) {
  return {
    type: PATHS_REQUEST + '_ERROR',
    meta: {
      error: message,
    }
  }
}

// ------------------------------------
// Get media paths
// ------------------------------------
export function fetchPaths () {
  return dispatch => {
    dispatch(requestPaths())

    return fetch('/api/paths', {
      method: 'GET',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receivePaths(response))
      })
      .catch(err => {
        dispatch(pathsError(err.message))
      })
  }
}

// ------------------------------------
// Add media path
// ------------------------------------
export function addPath (path) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PATH_ADD,
      payload: { path },
    })

    return fetch(`/api/paths`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ path })
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(res => {
        dispatch(receivePaths(res))
        dispatch(closePathChooser())
      })
      .catch(err => {
        dispatch({
          type: PATH_ADD + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// Remove media path
// ------------------------------------
export function removePath (pathId) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PATH_REMOVE,
      payload: pathId,
    })

    return fetch(`/api/paths/${pathId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(res => {
        dispatch(receivePaths(res))
        // dispatch(closePathChooser())
      })
      .catch(err => {
        dispatch({
          type: PATH_REMOVE + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// open/close path chooser
// ------------------------------------
export function openPathChooser () {
  return {
    type: PATH_CHOOSER_OPEN,
    payload: null,
  }
}

export function closePathChooser () {
  return {
    type: PATH_CHOOSER_CLOSE,
    payload: null
  }
}

// helper for fetch response
function checkStatus (response) {
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
  [PATHS_RECEIVE]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [PATH_CHOOSER_OPEN]: (state, { payload }) => ({
    ...state,
    isChoosing: true,
  }),
  [PATH_CHOOSER_CLOSE]: (state, { payload }) => ({
    ...state,
    isChoosing: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [],
  entities: {},
  isChoosing: false,
}

export default function paths (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
