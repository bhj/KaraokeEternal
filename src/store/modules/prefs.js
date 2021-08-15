import {
  PREFS_REQUEST,
  PREFS_RECEIVE,
  PREFS_SET,
  PREFS_SET_PATH_PRIORITY,
  PREFS_PUSH,
  PREFS_REQ_SCANNER_START,
  PREFS_REQ_SCANNER_STOP,
  SCANNER_WORKER_STATUS,
  _ERROR,
} from 'shared/actionTypes'

import { logout } from './user'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('prefs')

export function setPref (key, data) {
  return {
    type: PREFS_SET,
    payload: { key, data },
  }
}

export function setPathPriority (pathIds) {
  return {
    type: PREFS_SET_PATH_PRIORITY,
    payload: pathIds,
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

        // sign out if we see isFirstRun flag
        if (prefs.isFirstRun && getState().user.userId !== null) {
          dispatch(logout())
        }
      })
      .catch(err => {
        dispatch({
          type: PREFS_REQUEST + _ERROR,
          error: err.message,
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
// request media scan
// ------------------------------------
export function requestScan () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_REQ_SCANNER_START,
    })

    return api('GET', '/scan')
      .catch(err => {
        dispatch({
          type: PREFS_REQ_SCANNER_START + '_ERROR',
          error: err.message,
        })
      })
  }
}

// ------------------------------------
// request cancelation of media scan
// ------------------------------------
export function requestScanStop () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PREFS_REQ_SCANNER_STOP,
    })

    return api('GET', '/scan/stop')
      .catch(err => {
        dispatch({
          type: PREFS_REQ_SCANNER_STOP + '_ERROR',
          error: err.message,
        })
      })
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PREFS_RECEIVE]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [PREFS_PUSH]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [SCANNER_WORKER_STATUS]: (state, { payload }) => ({
    ...state,
    isScanning: payload.isScanning,
    scannerPct: payload.pct,
    scannerText: payload.text,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isScanning: false,
  isReplayGainEnabled: false,
  paths: { result: [], entities: {} },
  scannerPct: 0,
  scannerText: '',
}

export default function prefsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
