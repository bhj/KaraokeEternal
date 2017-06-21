import {
  REQUEST_PLAYER_PLAY,
  REQUEST_PLAYER_PAUSE,
  REQUEST_PLAYER_NEXT,
  REQUEST_PLAYER_VOLUME,
  PLAYER_STATUS,
  PLAYER_ERROR,
  PLAYER_LEAVE,
  GET_ROOMS,
  ROOM_EDITOR_OPEN,
  ROOM_EDITOR_CLOSE,
  ROOM_UPDATE,
  ROOM_CREATE,
  ROOM_REMOVE,
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

// ------------------------------------
// Create room
// ------------------------------------
export function createRoom (data) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: ROOM_CREATE,
      payload: { data },
    })

    return fetch(`/api/rooms`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(res => {
        dispatch(receiveRooms(res))
        dispatch(closeRoomEditor())
      })
      .catch(err => {
        dispatch({
          type: ROOM_CREATE + _ERROR,
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// Update room
// ------------------------------------
export function updateRoom (roomId, data) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: ROOM_UPDATE,
      payload: { roomId, ...data },
    })

    return fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(res => {
        dispatch(receiveRooms(res))
        dispatch(closeRoomEditor())
      })
      .catch(err => {
        dispatch({
          type: ROOM_UPDATE + _ERROR,
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// Remove room
// ------------------------------------
export function removeRoom (roomId) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: ROOM_REMOVE,
      payload: roomId,
    })

    return fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .then(res => res.json())
      .then(res => {
        dispatch(receiveRooms(res))
        dispatch(closeRoomEditor())
      })
      .catch(err => {
        dispatch({
          type: ROOM_REMOVE + _ERROR,
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// open/close room editor dialog
// ------------------------------------
export function openRoomEditor (roomId) {
  return {
    type: ROOM_EDITOR_OPEN,
    payload: roomId,
  }
}

export function closeRoomEditor () {
  return {
    type: ROOM_EDITOR_CLOSE,
    payload: null
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
  [ROOM_EDITOR_OPEN]: (state, { payload }) => ({
    ...state,
    isEditing: true,
    editingRoomId: payload,
  }),
  [ROOM_EDITOR_CLOSE]: (state, { payload }) => ({
    ...state,
    isEditing: false,
    editingRoomId: null,
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
  rooms: { result: [], entities: {} },
  errors: {},   // object of arrays keyed by queueId
  isEditing: false,
  editingRoomId: null,
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
