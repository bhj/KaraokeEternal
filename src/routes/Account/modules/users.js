import HttpApi from 'lib/HttpApi'
import {
  USERS_CREATE,
  USERS_EDITOR_CLOSE,
  USERS_EDITOR_OPEN,
  USERS_FILTER_ONLINE,
  USERS_FILTER_ROOM_ID,
  USERS_RECEIVE,
  USERS_REMOVE,
  USERS_REQUEST,
  USERS_UPDATE,
  _SUCCESS,
  _ERROR,
} from 'shared/actionTypes'

const api = new HttpApi('')

// ------------------------------------
// Get user list
// ------------------------------------
export function fetchUsers () {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: USERS_REQUEST,
    })

    return api('GET', 'users')
      .then(users => {
        dispatch(receiveUsers(users))
      })
      .catch(err => {
        dispatch({
          type: USERS_REQUEST + _ERROR,
          error: err.message,
        })
      })
  }
}

export function receiveUsers (users) {
  return {
    type: USERS_RECEIVE,
    payload: users,
  }
}

// ------------------------------------
// Create a user
// ------------------------------------
function requestCreate (data) {
  return {
    type: USERS_CREATE,
  }
}

function createSuccess () {
  return {
    type: USERS_CREATE + _SUCCESS,
  }
}

function createError (err) {
  return {
    type: USERS_CREATE + _ERROR,
    error: err.message,
  }
}

export function createUser (data) {
  return (dispatch, getState) => {
    dispatch(requestCreate(data))

    return api('POST', 'user', {
      body: data
    })
      .then(() => {
        dispatch(createSuccess())
        dispatch(fetchUsers())
      })
      .catch(err => {
        dispatch(createError(err))
      })
  }
}

// ------------------------------------
// Update a user
// ------------------------------------
function requestUpdate (data) {
  return {
    type: USERS_UPDATE,
    payload: data,
  }
}

function updateSuccess () {
  return {
    type: USERS_UPDATE + _SUCCESS,
  }
}

function updateError (err) {
  return {
    type: USERS_UPDATE + _ERROR,
    error: err.message,
  }
}

export function updateUser (userId, data) {
  return (dispatch, getState) => {
    dispatch(requestUpdate({
      userId,
      data,
    }))

    return api('PUT', `user/${userId}`, {
      body: data
    })
      .then(() => {
        dispatch(updateSuccess())
        dispatch(fetchUsers())
      })
      .catch(err => {
        dispatch(updateError(err))
      })
  }
}

// ------------------------------------
// Update a user
// ------------------------------------
function requestRemove (userId) {
  return {
    type: USERS_REMOVE,
    payload: { userId },
  }
}

function removeSuccess () {
  return {
    type: USERS_REMOVE + _SUCCESS,
  }
}

function removeError (err) {
  return {
    type: USERS_REMOVE + _ERROR,
    error: err.message,
  }
}

export function removeUser (userId) {
  return (dispatch, getState) => {
    dispatch(requestRemove(userId))

    return api('DELETE', `user/${userId}`)
      .then(() => {
        dispatch(removeSuccess())
        dispatch(fetchUsers())
      })
      .catch(err => {
        dispatch(removeError(err))
      })
  }
}

// ------------------------------------
// User editor UI
// ------------------------------------
export function closeUserEditor () {
  return {
    type: USERS_EDITOR_CLOSE,
  }
}

export function openUserEditor () {
  return {
    type: USERS_EDITOR_OPEN,
  }
}

export function filterByOnline (bool) {
  return {
    type: USERS_FILTER_ONLINE,
    payload: bool,
  }
}

export function filterByRoom (roomId) {
  return {
    type: USERS_FILTER_ROOM_ID,
    payload: roomId,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [USERS_CREATE + _SUCCESS]: (state, { payload }) => ({
    ...state,
    isEditorOpen: false,
  }),
  [USERS_RECEIVE]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [USERS_EDITOR_OPEN]: (state, { payload }) => ({
    ...state,
    isEditorOpen: true,
  }),
  [USERS_EDITOR_CLOSE]: (state, { payload }) => ({
    ...state,
    isEditorOpen: false,
  }),
  [USERS_FILTER_ONLINE]: (state, { payload }) => ({
    ...state,
    filterOnline: payload,
    filterRoomId: null,
  }),
  [USERS_FILTER_ROOM_ID]: (state, { payload }) => ({
    ...state,
    filterOnline: false,
    filterRoomId: payload,
  }),
  [USERS_REMOVE + _SUCCESS]: (state, { payload }) => ({
    ...state,
    isEditorOpen: false,
  }),
  [USERS_UPDATE + _SUCCESS]: (state, { payload }) => ({
    ...state,
    isEditorOpen: false,
  }),
}

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  result: [],
  entities: {},
  filterOnline: true,
  filterRoomId: null,
  isEditorOpen: false,
}

export default function usersReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
