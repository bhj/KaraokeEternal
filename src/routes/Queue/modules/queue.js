import fetch from 'isomorphic-fetch'

let fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

// ------------------------------------
// add to queue
// ------------------------------------
export const QUEUE_PUT = 'queue/QUEUE_PUT'
export const QUEUE_PUT_SUCCESS = 'queue/QUEUE_PUT_SUCCESS'
export const QUEUE_PUT_FAIL = 'queue/QUEUE_PUT_FAIL'

function requestPut(uid) {
  return {
    type: QUEUE_PUT,
    payload: uid
  }
}

function receivePut(queue) {
  return {
    type: QUEUE_PUT_SUCCESS,
    payload: queue
  }
}

function putError(message) {
  return {
    type: QUEUE_PUT_FAIL,
    payload: message
  }
}

export function queueSong(uid) {
  return (dispatch, getState) => {
    dispatch(requestPut(uid))

    return fetch('/api/queue/'+uid, {
        ...fetchConfig,
        method: 'PUT'
      })
      .then(checkStatus)
      .then(() => {
        const roomId = getState().account.user.roomId
        dispatch(requestQueueUpdate(roomId))
      })
      .catch(err => {
        dispatch(putError(err))
      })
  }
}

// ------------------------------------
// remove from queue
// ------------------------------------
export const QUEUE_DELETE = 'queue/QUEUE_DELETE'
export const QUEUE_DELETE_SUCCESS = 'queue/QUEUE_DELETE_SUCCESS'
export const QUEUE_DELETE_FAIL = 'queue/QUEUE_DELETE_FAIL'

function requestDelete(uid) {
  return {
    type: QUEUE_DELETE,
    payload: uid
  }
}

function receiveDelete(queue) {
  return {
    type: QUEUE_DELETE_SUCCESS,
    payload: queue
  }
}

function deleteError(message) {
  return {
    type: QUEUE_DELETE_FAIL,
    payload: message
  }
}

export function deleteItem(id) {
  return (dispatch, getState) => {
    dispatch(requestDelete(id))

    return fetch('/api/queue/'+id, {
        ...fetchConfig,
        method: 'DELETE'
      })
      .then(checkStatus)
      .then(() => {
        const roomId = getState().account.user.roomId
        dispatch(requestQueueUpdate(roomId))
      })
      .catch(err => {
        dispatch(deleteError(err))
      })
  }
}

// ------------------------------------
// sockets
// ------------------------------------

// dispatched to server
export const QUEUE_UPDATE = 'server/QUEUE_UPDATE'

export function requestQueueUpdate(roomId) {
  return {
    type: QUEUE_UPDATE,
    payload: roomId
  }
}

// emitted from server
export const QUEUE_UPDATE_SUCCESS = 'server/QUEUE_UPDATE_SUCCESS'

// ------------------------------------
// Helper for fetch response
// ------------------------------------
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
  [QUEUE_PUT]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [QUEUE_PUT_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [QUEUE_PUT_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
  [QUEUE_DELETE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [QUEUE_DELETE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [QUEUE_DELETE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
  [QUEUE_UPDATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    result: payload.result,
    entities: payload.entities
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isFetching: false,
  errorMessage: null,
  result: {queueIds: [], uids: []},
  entities: {}
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
