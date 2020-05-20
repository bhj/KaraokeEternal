import {
  REQUEST_ROOMS,
  ROOM_EDITOR_OPEN,
  ROOM_EDITOR_CLOSE,
  ROOM_UPDATE,
  ROOM_CREATE,
  ROOM_REMOVE,
  ROOM_TOGGLE_SHOW_ALL,
  _SUCCESS,
  _ERROR,
} from 'shared/actionTypes'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('rooms')

// ------------------------------------
// Actions
// ------------------------------------
function requestRooms () {
  return {
    type: REQUEST_ROOMS,
    payload: null
  }
}

function receiveRooms (response) {
  return {
    type: REQUEST_ROOMS + _SUCCESS,
    payload: response
  }
}

function roomsError (message) {
  return {
    type: REQUEST_ROOMS + _ERROR,
    error: message,
  }
}

export function fetchRooms () {
  return dispatch => {
    dispatch(requestRooms())

    return api('GET', '')
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

    return api('POST', '', {
      body: data
    })
      .then(res => {
        dispatch(receiveRooms(res))
        dispatch(closeRoomEditor())
      })
      .catch(err => {
        dispatch({
          type: ROOM_CREATE + _ERROR,
          error: err.message,
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

    return api('PUT', `/${roomId}`, {
      body: data
    })
      .then(res => {
        dispatch(receiveRooms(res))
        dispatch(closeRoomEditor())
      })
      .catch(err => {
        dispatch({
          type: ROOM_UPDATE + _ERROR,
          error: err.message,
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

    return api('DELETE', `/${roomId}`)
      .then(res => {
        dispatch(receiveRooms(res))
        dispatch(closeRoomEditor())
      })
      .catch(err => {
        dispatch({
          type: ROOM_REMOVE + _ERROR,
          error: err.message,
        })
      })
  }
}

// ------------------------------------
// room list/editor UI
// ------------------------------------
export function closeRoomEditor () {
  return {
    type: ROOM_EDITOR_CLOSE,
    payload: null
  }
}

export function openRoomEditor (roomId) {
  return {
    type: ROOM_EDITOR_OPEN,
    payload: roomId,
  }
}

export function toggleShowAll () {
  return {
    type: ROOM_TOGGLE_SHOW_ALL,
    payload: null
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_ROOMS + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
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
  [ROOM_TOGGLE_SHOW_ALL]: (state, { payload }) => ({
    ...state,
    isShowingAll: !state.isShowingAll,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [],
  entities: {},
  isEditing: false,
  isShowingAll: false,
  editingRoomId: null,
}

export default function rooms (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
