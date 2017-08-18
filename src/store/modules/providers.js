import {
  PROVIDER_REQUEST_PROVIDERS,
  PROVIDER_RECEIVE_PROVIDERS,
  PROVIDER_REQUEST_SCAN,
  PROVIDER_REQUEST_SCAN_CANCEL,
  PROVIDER_SCAN_STATUS,
} from 'actions'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('/api/providers') // plural

// ------------------------------------
// Actions
// ------------------------------------
function receiveProviders (response) {
  return {
    type: PROVIDER_RECEIVE_PROVIDERS,
    payload: response
  }
}

function providerError (message) {
  return {
    type: PROVIDER_REQUEST_PROVIDERS + '_ERROR',
    meta: {
      error: message,
    }
  }
}

// ------------------------------------
// Get media providers
// ------------------------------------
export function fetchProviders () {
  return dispatch => {
    // informational
    dispatch({
      type: PROVIDER_REQUEST_PROVIDERS,
      payload: null,
    })

    return api('GET', '/')
      .then(res => {
        dispatch(receiveProviders(res))
      })
      .catch(err => {
        dispatch(providerError(err.message))
      })
  }
}

// ------------------------------------
// request media scan
// ------------------------------------
export function requestScan (name) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PROVIDER_REQUEST_SCAN,
      payload: name,
    })

    return api('GET', `/scan?provider=${name}`)
      .catch(err => {
        dispatch({
          type: PROVIDER_REQUEST_SCAN + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// request cancelation of media scan
// ------------------------------------
export function requestScanCancel (provider) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: PROVIDER_REQUEST_SCAN_CANCEL,
      payload: null,
    })

    return api('GET', `/scan/cancel`)
      .catch(err => {
        dispatch({
          type: PROVIDER_REQUEST_SCAN_CANCEL + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PROVIDER_RECEIVE_PROVIDERS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [PROVIDER_SCAN_STATUS]: (state, { payload }) => ({
    ...state,
    isUpdating: payload.isUpdating,
    updateText: payload.text,
    updateProgress: payload.progress,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [],
  entities: {},
  // update status
  isUpdating: false,
  updateText: '',
  updateProgress: 0,
}

export default function providers (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
