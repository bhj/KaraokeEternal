import fetch from 'isomorphic-fetch'
import { browserHistory } from 'react-router'

export const PREFS_CHANGE_REQUEST = 'server/PREFS_CHANGE'
export const PREFS_CHANGE = 'ui/PREFS_CHANGE'
export const PROVIDER_REFRESH_REQUEST = 'server/PROVIDER_REFRESH'

// ------------------------------------
// Login
// ------------------------------------
export const LOGIN = 'account/LOGIN'
export const LOGIN_SUCCESS = 'account/LOGIN_SUCCESS'
export const LOGIN_FAIL = 'account/LOGIN_FAIL'

function requestLogin(creds) {
  return {
    type: LOGIN,
    payload: creds
  }
}

function receiveLogin(response) {
  return {
    type: LOGIN_SUCCESS,
    payload: response
  }
}

function loginError(message) {
  return {
    type: LOGIN_FAIL,
    meta: {
      error: message + ' (incorrect login)',
    }
  }
}

// calls api endpoint that should set an httpOnly cookie with
// our JWT, then establish the sockiet.io connection
export function loginUser(data) {
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

function parseQuery(qstr) {
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
export const LOGOUT = 'account/LOGOUT'
export const LOGOUT_SUCCESS = 'account/LOGOUT_SUCCESS'
export const LOGOUT_FAIL = 'account/LOGOUT_FAIL'

function requestLogout() {
  return {
    type: LOGOUT,
    payload: null
  }
}

function receiveLogout() {
  return {
    type: LOGOUT_SUCCESS,
    payload: null
  }
}

function logoutError(message) {
  return {
    type: LOGOUT_FAIL,
    meta: {
      error: message,
    }
  }
}

// Logs the user out
export function logoutUser() {
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
export const CREATE = 'account/CREATE'
export const CREATE_SUCCESS = 'account/CREATE_SUCCESS'
export const CREATE_FAIL = 'account/CREATE_FAIL'

function requestCreate(user) {
  return {
    type: CREATE,
    payload: user
  }
}

function receiveCreate() {
  return {
    type: CREATE_SUCCESS,
    payload: null
  }
}

function createError(message) {
  return {
    type: CREATE_FAIL,
    meta: {
      error: message,
    }
  }
}

export function createUser(user) {
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
export const UPDATE = 'account/UPDATE'
export const UPDATE_SUCCESS = 'account/UPDATE_SUCCESS'
export const UPDATE_FAIL = 'account/UPDATE_FAIL'

function requestUpdate(user) {
  return {
    type: UPDATE,
    payload: user
  }
}

function receiveUpdate(response) {
  return {
    type: UPDATE_SUCCESS,
    payload: response
  }
}

function updateError(message) {
  return {
    type: UPDATE_FAIL,
    meta: {
      error: message,
    }
  }
}

export function updateUser(data) {
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
export const GET_ROOMS = 'account/GET_ROOMS'
export const GET_ROOMS_SUCCESS = 'account/GET_ROOMS_SUCCESS'
export const GET_ROOMS_FAIL = 'account/GET_ROOMS_FAIL'

function requestRooms() {
  return {
    type: GET_ROOMS,
    payload: null
  }
}

function receiveRooms(response) {
  return {
    type: GET_ROOMS_SUCCESS,
    payload: response
  }
}

function roomsError(message) {
  return {
    type: GET_ROOMS_FAIL,
    meta: {
      error: message,
    }
  }
}

export function fetchRooms() {
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
const TOGGLE_SONG_STARRED = "server/TOGGLE_SONG_STARRED"
export function toggleSongStarred(songId) {
  return {
    type: TOGGLE_SONG_STARRED,
    payload: songId,
  }
}

// ------------------------------------
// Set prefs
// ------------------------------------
export function setPrefs(domain, data) {
  return {
    type: PREFS_CHANGE_REQUEST,
    payload: { domain, data },
  }
}

// ------------------------------------
// Provider re-scan
// ------------------------------------
export function providerRefresh(provider) {
  return {
    type: PROVIDER_REFRESH_REQUEST,
    payload: provider,
  }
}



// helper for fetch response
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
  [LOGIN_SUCCESS]: (state, {payload}) => ({
    ...state,
    ...payload,
  }),
  [UPDATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    ...payload,
  }),
  [LOGOUT_SUCCESS]: (state, {payload}) => ({
    ...state,
    userId: null,
    email: null,
    name: null,
    isAdmin: false,
    roomId: null,
    starredSongs: [],
  }),
  [GET_ROOMS_SUCCESS]: (state, {payload}) => ({
    ...state,
    rooms: payload,
  }),
  [TOGGLE_SONG_STARRED+'_SUCCESS']: (state, {payload}) => ({
    ...state,
    starredSongs: payload,
  }),
  [PREFS_CHANGE]: (state, {payload}) => ({
    ...state,
    prefs: payload,
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
  prefs: null,
  roomId: null,
  rooms: [],
  starredSongs: [],
}

export default function userReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
