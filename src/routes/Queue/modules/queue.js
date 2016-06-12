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
export const PUT_QUEUE = 'queue/PUT_QUEUE'
export const PUT_QUEUE_SUCCESS = 'queue/PUT_QUEUE_SUCCESS'
export const PUT_QUEUE_FAIL = 'queue/PUT_QUEUE_FAIL'

function requestPut(uid) {
  return {
    type: PUT_QUEUE,
    payload: uid
  }
}

function receivePut() {
  return {
    type: PUT_QUEUE_SUCCESS,
    payload: null
  }
}

function putError(message) {
  return {
    type: PUT_QUEUE_FAIL,
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
      // .then(response => response.json())
      .then(response => {
        dispatch(receivePut())
      })
      .catch(err => {
        dispatch(putError(err))
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
    entities: payload.entities.songs
  }),
  [GET_QUEUE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
  [PUT_QUEUE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [PUT_QUEUE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [PUT_QUEUE_FAIL]: (state, {payload}) => ({
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
