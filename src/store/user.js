import 'whatwg-fetch'

let fetchConfig = {
  credentials: 'same-origin',
  headers: new Headers({
    'Content-Type': 'application/json'
  })
}

// ------------------------------------
// Login
// ------------------------------------
export const LOGIN = 'user/LOGIN'
export const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS'
export const LOGIN_FAIL = 'user/LOGIN_FAIL'

function requestLogin(creds) {
  return {
    type: LOGIN,
    payload: creds
  }
}

function receiveLogin(token) {
  return {
    type: LOGIN_SUCCESS,
    payload: token
  }
}

function loginError(message) {
  return {
    type: LOGIN_FAIL,
    payload: message
  }
}

// Calls the API to get a token and
// dispatches actions along the way
export function loginUser(creds) {
  return dispatch => {
    dispatch(requestLogin(creds))

    return fetch('/api/account/login', {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(creds)
      })
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        localStorage.setItem('email', response.email)
        localStorage.setItem('name', response.name)
        dispatch(receiveLogin(response))
      })
      .catch(err => {
        dispatch(loginError(err))
      })
  }
}

// ------------------------------------
// Logout
// ------------------------------------
export const LOGOUT = 'user/LOGOUT'
export const LOGOUT_SUCCESS = 'user/LOGOUT_SUCCESS'
export const LOGOUT_FAIL = 'user/LOGOUT_FAIL'

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
    payload: message
  }
}

// Logs the user out
export function logoutUser() {
  return dispatch => {
    dispatch(requestLogout())

    return fetch('/api/account/logout', fetchConfig)
      .then(checkStatus)
      .then(response => {
        localStorage.removeItem('email')
        localStorage.removeItem('name')
        dispatch(receiveLogout())
      })
      .catch(err => {
        dispatch(logoutError(err))
      })
  }
}

// ------------------------------------
// Create account
// ------------------------------------
export const CREATE = 'user/CREATE'
export const CREATE_SUCCESS = 'user/CREATE_SUCCESS'
export const CREATE_FAIL = 'user/CREATE_FAIL'

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
    payload: message
  }
}

export function createUser(user) {
  return dispatch => {
    dispatch(requestCreate(user))

    return fetch('/api/account/create', {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(user)
      })
      .then(checkStatus)
      .then(response => {
        dispatch(receiveCreate())
        // should now be able to login
        // this.loginUser({email: user.email, password: user.password})
      })
      .catch(err => {
        dispatch(createError(err))
      })
  }
}

// ------------------------------------
// Update account
// ------------------------------------
export const UPDATE = 'user/UPDATE'
export const UPDATE_SUCCESS = 'user/UPDATE_SUCCESS'
export const UPDATE_FAIL = 'user/UPDATE_FAIL'

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
    payload: message
  }
}

export function updateUser(user) {
  return dispatch => {
    dispatch(requestUpdate(user))

    return fetch('/api/account/update', {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(user)
      })
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        localStorage.setItem('email', response.email)
        localStorage.setItem('name', response.name)
        dispatch(receiveUpdate(response))
      })
      .catch(err => {
        dispatch(updateError(err))
      })
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
  [LOGIN]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [LOGIN_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    isAuthenticated: true,
    email: payload.email,
    name: payload.name,
    errorMessage: null
  }),
  [LOGIN_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    isAuthenticated: false,
    errorMessage: payload.message
  }),
  [LOGOUT]: (state, {payload}) => ({
    ...state,
    isFetching: true
  }),
  [LOGOUT_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    isAuthenticated: false,
    email: null,
    name: null,
    errorMessage: null
  }),
  [LOGOUT_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
  [CREATE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [CREATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: null
  }),
  [CREATE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
  [UPDATE]: (state, {payload}) => ({
    ...state,
    isFetching: true,
    errorMessage: null
  }),
  [UPDATE_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    email: payload.email,
    name: payload.name,
    errorMessage: null
  }),
  [UPDATE_FAIL]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    errorMessage: payload.message
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  isFetching: false,
  email: localStorage.getItem('email'),
  name: localStorage.getItem('name')
}

initialState.isAuthenticated = (initialState.email !== null && initialState.name !== null)

export default function userReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
