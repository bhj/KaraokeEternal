import {
  SONG_TOGGLE_STARRED,
  SOCKET_AUTH_ERROR,
  LOGIN,
  LOGOUT,
  CREATE,
  UPDATE,
  _SUCCESS,
  _ERROR,
} from 'constants/actions'
import { fetchPrefs } from './prefs'
import { browserHistory } from 'react-router'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('')

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

    return api('POST', 'login', {
      body: data
    })
      .then(user => {
        // user object in response body
        dispatch(receiveLogin(user))

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

        // update preferences
        if (user.isAdmin) {
          dispatch(fetchPrefs())
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

    return api('GET', 'logout')
      .then(response => {
        // server response should have cleared our cookie
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

function receiveCreate (user) {
  return {
    type: CREATE + _SUCCESS,
    payload: user
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

    return api('POST', 'account', {
      body: user
    })
      .then(user => {
        dispatch(receiveCreate(user))

        // socket.io handshake happens over http so
        // our JWT will be sent in the cookie
        window._socket.open()

        if (user.isAdmin) {
          dispatch(fetchPrefs())
        }
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

    return api('PUT', 'account', {
      body: data
    })
      .then(user => {
        dispatch(receiveUpdate(user))
      })
      .catch(err => {
        dispatch(updateError(err.message))
      })
  }
}

// ------------------------------------
// Star songs
// ------------------------------------
export function toggleSongStarred (songId) {
  return {
    type: SONG_TOGGLE_STARRED,
    payload: { songId },
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
  [CREATE + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [LOGOUT + _SUCCESS]: (state, { payload }) => ({
    ...initialState,
  }),
  [SOCKET_AUTH_ERROR]: (state, { payload }) => ({
    ...initialState,
  }),
  [SONG_TOGGLE_STARRED + _SUCCESS]: (state, { payload }) => ({
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
  starredArtists: [],
  starredSongs: [],
}

export default function userReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
