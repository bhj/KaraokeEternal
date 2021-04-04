import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import locationHelperBuilder from 'redux-auth-wrapper/history4/locationHelper'
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
const locationHelper = locationHelperBuilder({})

// ------------------------------------
// Login
// ------------------------------------
function requestLogin (creds) {
  return {
    type: LOGIN,
    payload: creds
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
export function login (data) {
  return (dispatch, getState) => {
    dispatch(requestLogin(data))

    return api('POST', 'login', {
      body: data
    })
      .then(user => {
        // user object in response body
        dispatch(receiveLogin(user))
        dispatch(connectSocket())
        window._socket.open()

        // update preferences
        if (user.isAdmin) {
          dispatch(fetchPrefs())
        }

        // redirect in query string?
        const redirect = locationHelper.getRedirectQueryParam(history)

        if (redirect) {
          return history.push(redirect)
        }

        // default redirect if not an admin
        if (!user.isAdmin) {
          history.push('/library')
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
    payload: null
  }
}

function receiveLogout () {
  return {
    type: LOGOUT + _SUCCESS,
    payload: null
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
function requestCreate (user) {
  return {
    type: CREATE_ACCOUNT,
    payload: user
  }
}

function receiveCreate (user) {
  return {
    type: CREATE_ACCOUNT + _SUCCESS,
    payload: user
  }
}

function createError (err) {
  return {
    type: CREATE_ACCOUNT + _ERROR,
    error: err.message,
  }
}

export function createAccount (user, isFirstRun) {
  return (dispatch, getState) => {
    dispatch(requestCreate(user))

    const isFirstRun = !!getState().prefs.isFirstRun

    return api('POST', isFirstRun ? 'setup' : 'account', {
      body: user
    })
      .then(user => {
        dispatch(receiveCreate(user))
        dispatch(connectSocket())
        window._socket.open()

        if (!user.isAdmin) {
          // default redirect
          history.push('/library')
          return
        }

        dispatch(fetchPrefs())
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
// Request account (does not refresh JWT)
// ------------------------------------
function requestAccount () {
  return {
    type: REQUEST_ACCOUNT,
  }
}

function receiveAccount (response) {
  return {
    type: REQUEST_ACCOUNT + _SUCCESS,
    payload: response
  }
}

function requestAccountError (err) {
  return {
    type: REQUEST_ACCOUNT + _ERROR,
    payload: err.message, // silent (don't set error property)
  }
}

export function fetchAccount () {
  return (dispatch, getState) => {
    dispatch(requestAccount())

    return api('GET', 'account')
      .then(user => {
        dispatch(receiveAccount(user))
      })
      .catch(err => {
        dispatch(requestAccountError(err))
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
