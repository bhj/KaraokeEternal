import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { fetchPrefs } from './prefs'
import HttpApi from 'lib/HttpApi'
import history from 'lib/history'
import {
  LOGIN,
  LOGOUT,
  CREATE_ACCOUNT,
  UPDATE_ACCOUNT,
  REQUEST_ACCOUNT,
  _SUCCESS,
  _ERROR,
  SOCKET_REQUEST_CONNECT,
  SOCKET_AUTH_ERROR,
} from 'shared/actionTypes'

const api = new HttpApi('')

// ------------------------------------
// Login
// ------------------------------------
function requestLogin (creds) {
  return {
    type: LOGIN,
    payload: creds,
  }
}

function receiveLogin (user) {
  return {
    type: LOGIN + _SUCCESS,
    payload: user,
  }
}

function loginError (err) {
  return {
    type: LOGIN + _ERROR,
    error: err.message,
  }
}

// calls api endpoint that should set an httpOnly cookie with
// our JWT, then establish the sockiet.io connection
export function login (creds) {
  return (dispatch, getState) => {
    dispatch(requestLogin(creds))

    return api('POST', 'login', {
      body: creds
    })
      .then(user => {
        // signing in can cause additional reducers to be injected and
        // trigger rehydration with stale data, so purge here first
        window._persistor.purge()

        // user object in response body
        dispatch(receiveLogin(user))
        dispatch(connectSocket())
        window._socket.open()

        if (user.isAdmin) {
          dispatch(fetchPrefs())
        }

        // redirect in query string?
        const redirect = new URLSearchParams(history.location.search).get('redirect')

        if (redirect) {
          history.push(redirect)
        }
      })
      .catch(err => {
        dispatch(loginError(err))
      })
  }
}

// ------------------------------------
// Logout
// ------------------------------------
function requestLogout () {
  return {
    type: LOGOUT,
  }
}

function receiveLogout () {
  return {
    type: LOGOUT + _SUCCESS,
  }
}

function logoutError (err) {
  return {
    type: LOGOUT + _ERROR,
    error: err.message,
  }
}

// Logs the user out
export function logout () {
  return (dispatch, getState) => {
    dispatch(requestLogout())

    return api('GET', 'logout')
      .then(response => {
        // server response should have cleared our cookie
        dispatch(receiveLogout())
      })
      .catch(err => {
        dispatch(logoutError(err))
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
function requestCreate (data) {
  // FormData is browser-native and not coercible for display as the payload
  return {
    type: CREATE_ACCOUNT,
  }
}

function createSuccess () {
  return {
    type: CREATE_ACCOUNT + _SUCCESS,
  }
}

function createError (err) {
  return {
    type: CREATE_ACCOUNT + _ERROR,
    error: err.message,
  }
}

export function createAccount (data, isFirstRun) {
  return (dispatch, getState) => {
    dispatch(requestCreate(data))

    const isFirstRun = getState().prefs.isFirstRun

    return api('POST', isFirstRun ? 'setup' : 'user', {
      body: data
    })
      .then(res => {
        // if firstRun, response should contain the newly-created room's id
        if (isFirstRun && typeof res.roomId !== 'number') {
          throw new Error('firstRun: No roomId in response')
        }

        dispatch(createSuccess())

        return dispatch(login({
          username: res.username,
          password: data.get('newPassword'),
          roomId: isFirstRun ? res.roomId : data.get('roomId'),
          roomPassword: data.get('roomPassword'),
        }))
      })
      .catch(err => {
        dispatch(createError(err))
      })
  }
}

// ------------------------------------
// Update account
// ------------------------------------
function requestUpdate (data) {
  // FormData is browser-native and not coercible for display as the payload
  return {
    type: UPDATE_ACCOUNT,
  }
}

function receiveUpdate (response) {
  return {
    type: UPDATE_ACCOUNT + _SUCCESS,
    payload: response,
  }
}

function updateError (err) {
  return {
    type: UPDATE_ACCOUNT + _ERROR,
    error: err.message,
  }
}

export function updateAccount (data) {
  return (dispatch, getState) => {
    const { userId } = getState().user

    dispatch(requestUpdate())

    return api('PUT', `user/${userId}`, {
      body: data
    })
      .then(user => {
        dispatch(receiveUpdate(user))
        alert('Account updated successfully.')
      })
      .catch(err => {
        dispatch(updateError(err))
      })
  }
}

// ------------------------------------
// Socket actions
// ------------------------------------
function requestSocketConnect (query) {
  return {
    type: SOCKET_REQUEST_CONNECT,
    payload: { query }
  }
}

export function connectSocket () {
  return (dispatch, getState) => {
    const versions = {
      library: getState().library.version,
      stars: getState().starCounts.version,
    }

    dispatch(requestSocketConnect(versions))
    window._socket.io.opts.query = versions
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
  [UPDATE_ACCOUNT + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [CREATE_ACCOUNT + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [REQUEST_ACCOUNT + _SUCCESS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [LOGOUT + _SUCCESS]: (state, { payload }) => ({
    ...initialState,
  }),
  [SOCKET_AUTH_ERROR]: (state, { payload }) => ({
    ...initialState,
  }),
}

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  userId: null,
  username: null,
  name: null,
  roomId: null,
  isAdmin: false,
  dateCreated: 0,
  dateUpdated: 0,
}

function userReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}

export default persistReducer({
  key: 'user',
  storage,
}, userReducer)
