import {
  PREFS_REQUEST,
  PREFS_SET,
  PREFS_RECEIVE,
  PREFS_REQUEST_SCAN,
  PREFS_REQUEST_SCAN_CANCEL,
  SCANNER_WORKER_STATUS,
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
// request media scan
// ------------------------------------
export function requestScan () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_REQUEST_SCAN,
    })

    return api('GET', `/scan`)
      .catch(err => {
        dispatch({
          type: PREFS_REQUEST_SCAN + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// request cancelation of media scan
// ------------------------------------
export function requestScanCancel () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_REQUEST_SCAN_CANCEL,
    })

    return api('GET', `/scan/cancel`)
      .catch(err => {
        dispatch({
          type: PREFS_REQUEST_SCAN_CANCEL + '_ERROR',
          meta: { error: err.message },
        })
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
  [SCANNER_WORKER_STATUS]: (state, { payload }) => ({
    ...state,
    isUpdating: payload.isUpdating,
    updateText: payload.text,
    updateProgress: payload.progress,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  isUpdating: false,
  updateText: '',
  updateProgress: 0,
  paths: { result: [], entities: {} }
}

export default function prefsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
