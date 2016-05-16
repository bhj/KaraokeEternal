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
  let config = {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(creds)
  }

  return dispatch => {
    dispatch(requestLogin(creds))

    return fetch('/api/account/login', config)
      .then(checkStatus)
      .then(response => response.json())
      .then(response => {
        localStorage.setItem('isAuthenticated', JSON.stringify(true))
        localStorage.setItem('email', JSON.stringify(response.email))
        localStorage.setItem('name', JSON.stringify(response.name))
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

    return fetch('/api/account/logout')
      .then(checkStatus)
      .then(response => {
        localStorage.setItem('isAuthenticated', JSON.stringify(false))
        localStorage.setItem('email', JSON.stringify(null))
        localStorage.setItem('name', JSON.stringify(null))
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
  let config = {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(user)
  }

  return dispatch => {
    dispatch(requestCreate(user))

    return fetch('/api/account/create', config)
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
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isFetching: false,
  isAuthenticated: JSON.parse(localStorage.getItem('isAuthenticated')),
  email: JSON.parse(localStorage.getItem('email')),
  name: JSON.parse(localStorage.getItem('name'))
}

export default function userReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
