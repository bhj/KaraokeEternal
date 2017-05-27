import {
  REQUEST_PLAYER_PLAY,
  REQUEST_PLAYER_PAUSE,
  REQUEST_PLAYER_NEXT,
  REQUEST_PLAYER_VOLUME,
  PLAYER_STATUS,
  PLAYER_ERROR,
  PLAYER_LEAVE,
  GET_ROOMS,
  _SUCCESS,
  _ERROR,
} from 'constants'

// ------------------------------------
// Actions
// ------------------------------------
export function requestPlay () {
  return {
    type: REQUEST_PLAYER_PLAY,
  }
}

export function requestPause () {
  return {
    type: REQUEST_PLAYER_PAUSE,
  }
}

export function requestPlayNext () {
  return {
    type: REQUEST_PLAYER_NEXT,
  }
}
export function requestVolume (vol) {
  return {
    type: REQUEST_PLAYER_VOLUME,
    payload: vol,
    meta: {
      throttle: {
        wait: 200,
        leading: false,
      }
    },
  }
}

// ------------------------------------
// Rooms
// ------------------------------------
function requestRooms () {
  return {
    type: GET_ROOMS,
    payload: null
  }
}

function receiveRooms (response) {
  return {
    type: GET_ROOMS + _SUCCESS,
    payload: response
  }
}

function roomsError (message) {
  return {
    type: GET_ROOMS + _ERROR,
    meta: {
      error: message,
    }
  }
}

export function fetchRooms () {
  return dispatch => {
    dispatch(requestRooms())

    return fetch('/api/rooms')
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        dispatch(receiveRooms(response))
      })
      .catch(err => {
        dispatch(roomsError(err.message))
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
  [PLAYER_STATUS]: (state, { payload }) => {
    return {
      ...state,
      ...payload,
      isPlayerPresent: true,
    }
  },
  [PLAYER_LEAVE]: (state, { payload }) => {
    return {
      ...state,
      isPlayerPresent: false,
      isPlaying: false,
    }
  },
  [PLAYER_ERROR]: (state, { payload }) => {
    const { queueId, message } = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        // can be multiple errors for a media item
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(message) : [message]
      }
    }
  },
  [GET_ROOMS + _SUCCESS]: (state, { payload }) => ({
    ...state,
    rooms: payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  queueId: -1,
  position: 0,
  volume: 1,
  isPlaying: false,
  isAtQueueEnd: false,
  isPlayerPresent: false,
  rooms: [],
  errors: {},   // object of arrays keyed by queueId
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
