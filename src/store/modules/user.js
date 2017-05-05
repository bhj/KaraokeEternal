import fetch from 'isomorphic-fetch'
import { browserHistory } from 'react-router'

import {
  TOGGLE_SONG_STARRED,
  LOGIN,
  LOGOUT,
  CREATE,
  UPDATE,
  GET_ROOMS,
  _SUCCESS,
  _ERROR,
} from 'constants'

// ------------------------------------
// Login
// ------------------------------------
function requestLogin (creds) {
  return {
    type: LOGIN,
    payload: creds
  }
}

function receiveLogin (response) {
  return {
    type: LOGIN + _SUCCESS,
    payload: response
  }
}

function loginError (message) {
  return {
    type: LOGIN + _ERROR,
    meta: {
      error: message + ' (incorrect login)',
    }
  }
}

// calls api endpoint that should set an httpOnly cookie with
// our JWT, then establish the sockiet.io connection
export function loginUser (data) {
  return (dispatch, getState) => {
    dispatch(requestLogin(data))

    return fetch('/api/login', {
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
        // user object in response body
        dispatch(receiveLogin(res))

        // socket.io handshake happens over http so
        // our JWT will be sent in the cookie
        window._socket.open()

        // check for redirect in query string
        let loc = getState().location

        if (loc && loc.search) {
          let query = parseQuery(loc.search)

          if (query.redirect) {
            browserHistory.push(query.redirect)
          }
        }
      })
      .catch(err => {
        dispatch(loginError(err.message))
      })
  }
}

function parseQuery (qstr) {
  var query = {}
  var a = qstr.substr(1).split('&')
  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=')
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '')
  }
  return query
}

// ------------------------------------
// Logout
// ------------------------------------
function requestLogout () {
  return {
    type: LOGOUT,
    payload: null
  }
}

function receiveLogout () {
  return {
    type: LOGOUT + _SUCCESS,
    payload: null
  }
}

function logoutError (message) {
  return {
    type: LOGOUT + _ERROR,
    meta: {
      error: message,
    }
  }
}

// Logs the user out
export function logoutUser () {
  return (dispatch, getState) => {
    dispatch(requestLogout())

    return fetch('/api/logout', {
      credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(response => {
      // should clear cookie field containing JWT
      dispatch(receiveLogout())
    })
    .catch(err => {
      dispatch(logoutError(err.message))
    })
    .then(() => {
      // regardless of server response; we tried!
      window._persistor.purge()

      // disconnect socket
      window._socket.close()
    })
  }
}

// ------------------------------------
// Create account
// ------------------------------------
function requestCreate (user) {
  return {
    type: CREATE,
    payload: user
  }
}

function receiveCreate () {
  return {
    type: CREATE + _SUCCESS,
    payload: null
  }
}

function createError (message) {
  return {
    type: CREATE + _ERROR,
    meta: {
      error: message,
    }
  }
}

export function createUser (user) {
  return dispatch => {
    dispatch(requestCreate(user))

    return fetch('/api/account/create', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(user)
    })
      .then(checkStatus)
      .then(response => {
        dispatch(receiveCreate())
        // should now be able to login
        // this.loginUser({email: user.email, password: user.password})
      })
      .catch(err => {
        dispatch(createError(err.message))
      })
  }
}

// ------------------------------------
// Update account
// ------------------------------------
function requestUpdate (user) {
  return {
    type: UPDATE,
    payload: user
  }
}

function receiveUpdate (response) {
  return {
    type: UPDATE + _SUCCESS,
    payload: response
  }
}

function updateError (message) {
  return {
    type: UPDATE + _ERROR,
    meta: {
      error: message,
    }
  }
}

export function updateUser (data) {
  return (dispatch, getState) => {
    dispatch(requestUpdate(data))

    return fetch('/api/account/update', {
      method: 'POST',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(response => response.json())
      .then(user => {
        dispatch(receiveUpdate(user))
      })
      .catch(err => {
        dispatch(updateError(err.message))
      })
  }
}

// ------------------------------------
// Available Rooms
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
// Star songs
// ------------------------------------
export function toggleSongStarred (songId) {
  return {
    type: TOGGLE_SONG_STARRED,
    payload: songId,
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
  [LOGIN + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [UPDATE + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [LOGOUT + _SUCCESS]: (state, { payload }) => ({
    ...state,
    userId: null,
    email: null,
    name: null,
    isAdmin: false,
    roomId: null,
    starredSongs: [],
  }),
  [GET_ROOMS + _SUCCESS]: (state, { payload }) => ({
    ...state,
    rooms: payload,
  }),
  [TOGGLE_SONG_STARRED + _SUCCESS]: (state, { payload }) => ({
    ...state,
    starredSongs: payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  userId: null,
  email: null,
  name: null,
  isAdmin: false,
  roomId: null,
  rooms: [],
  starredSongs: [],
}

export default function userReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
