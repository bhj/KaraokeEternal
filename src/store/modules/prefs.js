import fetch from 'isomorphic-fetch'

import {
  PREFS_REQUEST,
  PREFS_SET,
  PREFS_RECEIVE,
  REQUEST_SCAN,
  _SUCCESS,
  _ERROR,
} from 'constants'

// ------------------------------------
// Set prefs (curried with domain before being
// passed to providers)
// ------------------------------------
export function setPrefs (domain, data) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_SET,
      payload: { domain, data },
    })

    return fetch(`/api/prefs?domain=${encodeURIComponent(domain)}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(prefs => {
        dispatch(receivePrefs(prefs))
      })
      .catch(err => {
        dispatch({
          type: PREFS_SET + _ERROR,
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// fetch() prefs
// ------------------------------------
export function fetchPrefs () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_REQUEST,
    })

    return fetch(`/api/prefs`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(prefs => {
        dispatch(receivePrefs(prefs))
      })
      .catch(err => {
        dispatch({
          type: PREFS_REQUEST + _ERROR,
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// Receive prefs
// ------------------------------------
export function receivePrefs (data) {
  return {
    type: PREFS_RECEIVE,
    payload: data,
  }
}

// ------------------------------------
// Provider re-scan
// ------------------------------------
export function requestScan (provider) {
  return (dispatch, getState) => {
    // informational only
    dispatch({
      type: REQUEST_SCAN,
      payload: { provider },
    })

    return fetch(`/api/provider/${provider}/scan`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .then(() => {
        // informational only
        dispatch({
          type: REQUEST_SCAN + _SUCCESS,
        })
      })
      .catch(err => {
        dispatch({
          type: REQUEST_SCAN + _ERROR,
          meta: { error: err.message },
        })
      })
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
  [PREFS_RECEIVE]: (state, { payload }) => ({
    // not all domains may be returned
    ...state,
    ...payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {}

export default function prefsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
