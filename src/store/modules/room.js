import {
  LOGOUT,
  REQUEST_ROOM,
  _SUCCESS,
  _ERROR,
} from 'shared/actionTypes'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('rooms')

// ------------------------------------
// Actions
// ------------------------------------
function requestRoom () {
  return {
    type: REQUEST_ROOM,
    payload: null
  }
}

function receiveRoom (response) {
  return {
    type: REQUEST_ROOM + _SUCCESS,
    payload: response
  }
}

function roomError (message) {
  return {
    type: REQUEST_ROOM + _ERROR,
    error: message,
  }
}

export function fetchRoom (roomId) {
  return dispatch => {
    dispatch(requestRoom())

    return api('GET', '/'+roomId)
      .then(response => {
        dispatch(receiveRoom(response))
      })
      .catch(err => {
        dispatch(roomError(err.message))
      })
  }
}


// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LOGOUT + _SUCCESS]: (state, { payload }) => ({
    ...initialState,
  }),
  [REQUEST_ROOM + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  entity: {},
}

export default function room (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
