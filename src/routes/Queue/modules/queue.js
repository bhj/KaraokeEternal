import fetch from 'isomorphic-fetch'

let fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

// ------------------------------------
// Get queue
// ------------------------------------
export const GET_QUEUE = 'queue/GET_QUEUE'
export const GET_QUEUE_SUCCESS = 'queue/GET_QUEUE_SUCCESS'
export const GET_QUEUE_FAIL = 'queueGET_QUEUE_FAIL'

function requestQueue() {
  return {
    type: GET_QUEUE,
    payload: null
  }
}

function receiveQueue(response) {
  return {
    type: GET_QUEUE_SUCCESS,
    payload: response
  }
}

function queueError(message) {
  return {
    type: GET_QUEUE_FAIL,
    payload: message
  }
}

export function fetchQueue() {
  return dispatch => {
    dispatch(requestQueue())

    return fetch('/api/queue', fetchConfig)
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receiveQueue(response))
      })
      .catch(err => {
        dispatch(queueError(err))
      })
  }
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
  return dispatch => {
    dispatch(requestPut(uid))

    return fetch('/api/queue/'+uid, {
        ...fetchConfig,
        method: 'PUT'
      })
      .then(checkStatus)
      .then(response => response.json())
      .then(queue => {
        dispatch(receivePut(queue))
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
  return dispatch => {
    dispatch(requestDelete(id))

    return fetch('/api/queue/'+id, {
        ...fetchConfig,
        method: 'DELETE'
      })
      .then(checkStatus)
      .then(response => response.json())
      .then(queue => {
        dispatch(receiveDelete(queue))
      })
      .catch(err => {
        dispatch(deleteError(err))
      })
  }
}

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
  [GET_QUEUE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [GET_QUEUE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    result: payload.result,
    entities: payload.entities
  }),
  [GET_QUEUE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
  [QUEUE_PUT]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [QUEUE_PUT_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    result: payload.result,
    entities: payload.entities
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
    result: payload.result,
    entities: payload.entities
  }),
  [QUEUE_DELETE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isFetching: false,
  errorMessage: null,
  result: [],
  entities: {}
};

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type];

  return handler ? handler(state, action) : state;
}
