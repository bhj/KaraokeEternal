import fetch from 'isomorphic-fetch'
import { browserHistory } from 'react-router'

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
    payload: null,
    error: message + ' (incorrect login)',
  }
}

// Calls the API to get a token (stored in httpOnly cookie)
// and connects to the socket with said cookie
export function loginUser(data) {
  return (dispatch, getState) => {
    dispatch(requestLogin(data))

    return fetch('/api/account/login', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data)
      })
      .then(checkStatus)
      .then(res => res.json())
      .then(res => {
        dispatch(receiveLogin(res))
        dispatch(authenticateSocket(res.token))

        localStorage.setItem('user', JSON.stringify(res.user))
        localStorage.setItem('token', res.token)

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
// socket.io authentication
// ------------------------------------
const SOCKET_AUTHENTICATE = 'server/SOCKET_AUTHENTICATE'
const SOCKET_AUTHENTICATE_SUCCESS = 'account/SOCKET_AUTHENTICATE_SUCCESS'

export function authenticateSocket(token) {
  return {
    type: SOCKET_AUTHENTICATE,
    payload: token,
  }
}

const SOCKET_DEAUTHENTICATE = 'server/SOCKET_DEAUTHENTICATE'

export function deauthenticateSocket() {
  return {
    type: SOCKET_DEAUTHENTICATE,
    payload: null,
  }
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
    payload: null,
    error: message,
  }
}

// Logs the user out
export function logoutUser() {
  return (dispatch, getState) => {
    dispatch(requestLogout())

    return fetch('/api/account/logout', {
      headers: new Headers({
        'Authorization': 'Bearer ' + getState().account.token,
      }),
    })
      .then(checkStatus)
      .then(response => {
        dispatch(receiveLogout())
        dispatch(deauthenticateSocket())

        localStorage.removeItem('user')
        localStorage.removeItem('token')
      })
      .catch(err => {
        dispatch(logoutError(err.message))
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
    payload: null,
    error: message,
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
    payload: null,
    error: message,
  }
}

export function updateUser(data) {
  return (dispatch, getState) => {
    dispatch(requestUpdate(data))

    return fetch('/api/account/update', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getState().account.token,
        }),
        body: JSON.stringify(data)
      })
      .then(checkStatus)
      .then(response => response.json())
      .then(user => {
        localStorage.setItem('user', JSON.stringify(user))
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
    payload: null,
    error: message,
  }
}

export function fetchRooms() {
  return dispatch => {
    dispatch(requestRooms())

    return fetch('/api/account/rooms')
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
// Misc
// ------------------------------------
export const CHANGE_VIEW = 'account/CHANGE_VIEW'

export function changeView(mode) {
  return {
    type: CHANGE_VIEW,
    payload: mode
  }
}

// helper for fetch response``
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
  [LOGIN]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [LOGIN_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    user: payload.user,
    token: payload.token,
  }),
  [LOGIN_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [LOGOUT]: (state, {payload}) => ({
    ...state,
    isFetching: true
  }),
  [LOGOUT_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    user: null,
    token: null,
  }),
  [LOGOUT_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [CREATE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [CREATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [CREATE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [UPDATE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [UPDATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    user: payload,
  }),
  [UPDATE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [GET_ROOMS]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [GET_ROOMS_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    rooms: payload,
  }),
  [GET_ROOMS_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
  }),
  [CHANGE_VIEW]: (state, {payload}) => ({
    ...state,
    viewMode: payload,
  }),
  [SOCKET_AUTHENTICATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    user: payload,
  }),
  [SOCKET_DEAUTHENTICATE]: (state, {payload}) => ({
    ...state,
    user: null,
    token: null,
  }),
  }

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user')),
  isFetching: false,
  rooms: [],
  viewMode: 'login'
}

export default function accountReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
