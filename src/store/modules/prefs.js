import {
  PREFS_REQUEST,
  PREFS_SET,
  PREFS_RECEIVE,
  _ERROR,
} from 'constants/actions'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('prefs')
// ------------------------------------
// Set prefs
// ------------------------------------
export function setPrefs (domain, data) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_SET,
      payload: { domain, data },
    })

    return api('PUT', `?domain=${encodeURIComponent(domain)}`, {
      body: data
    })
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
// Fetch all prefs
// ------------------------------------
export function fetchPrefs () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_REQUEST,
    })

    return api('GET', '')
      .then(prefs => {
        dispatch(receivePrefs(prefs))
      })
      .catch(err => {
        // ignore if we aren't an admin
        if (getState().user.isAdmin) {
          dispatch({
            type: PREFS_REQUEST + _ERROR,
            meta: { error: err.message },
          })
        }
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
