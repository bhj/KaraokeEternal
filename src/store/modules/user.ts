import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { fetchPrefs } from './prefs'
import HttpApi from 'lib/HttpApi'
import {
  ACCOUNT_RECEIVE,
  ACCOUNT_REQUEST,
  ACCOUNT_CREATE,
  ACCOUNT_UPDATE,
  LOGIN,
  LOGOUT,
  SOCKET_AUTH_ERROR,
  SOCKET_REQUEST_CONNECT,
} from 'shared/actionTypes'

const api = new HttpApi('')
const basename = new URL(document.baseURI).pathname

// ------------------------------------
// Login
// ------------------------------------
const receiveAccount = createAction<object>(ACCOUNT_RECEIVE)

export const login = createAsyncThunk(
  LOGIN,
  async (creds: object, thunkAPI) => {
    // calls api endpoint that should set an httpOnly cookie with
    // our JWT, then establish the sockiet.io connection
    const user = await api('POST', 'login', {
      body: creds
    })

    // signing in can cause additional reducers to be injected and
    // trigger rehydration with stale data, so purge here first
    window._persistor.purge()

    thunkAPI.dispatch(receiveAccount(user))
    thunkAPI.dispatch(connectSocket())
    window._socket.open()

    if (user.isAdmin) {
      thunkAPI.dispatch(fetchPrefs())
    }

    // redirect in query string?
    const redirect = new URLSearchParams(window.location.search).get('redirect')

    if (redirect) {
      window._router.navigate(basename.replace(/\/$/, '') + redirect)
    }
  }
)

// ------------------------------------
// Logout
// ------------------------------------
export const logout = createAsyncThunk(
  LOGOUT,
  async () => {
    try {
      // server response should clear our cookie
      await api('GET', 'logout')
    } catch (err) {
      // ignore errors
    }

    window._persistor.purge()
    window._socket.close()
  }
)

// ------------------------------------
// Create account
// ------------------------------------
export const createAccount = createAsyncThunk(
  ACCOUNT_CREATE,
  async (data: FormData, thunkAPI) => {
    const isFirstRun = thunkAPI.getState().prefs.isFirstRun

    const response = await api('POST', isFirstRun ? 'setup' : 'user', {
      body: data
    })

    // if firstRun, response should contain the newly-created room's id
    if (isFirstRun && typeof response.roomId !== 'number') {
      throw new Error('firstRun: No roomId in response')
    }

    thunkAPI.dispatch(login({
      username: data.get('username'),
      password: data.get('newPassword'),
      roomId: isFirstRun ? response.roomId : data.get('roomId'),
      roomPassword: data.get('roomPassword'),
    }))
  }
)

// ------------------------------------
// Update account
// ------------------------------------
export const updateAccount = createAsyncThunk(
  ACCOUNT_UPDATE,
  async (data: FormData, thunkAPI) => {
    const { userId } = thunkAPI.getState().user

    const user = await api('PUT', `user/${userId}`, {
      body: data
    })

    thunkAPI.dispatch(receiveAccount(user))
    alert('Account updated successfully.')
  }
)

// ------------------------------------
// Request account (does not refresh JWT)
// ------------------------------------
export const fetchAccount = createAsyncThunk(
  ACCOUNT_REQUEST,
  async (_, thunkAPI) => {
    try {
      const user = await api('GET', 'user')
      thunkAPI.dispatch(receiveAccount(user))
    } catch (err) {
      // ignore errors
    }
  }
)

// ------------------------------------
// Socket actions
// ------------------------------------
const requestSocketConnect = createAction<object>(SOCKET_REQUEST_CONNECT)

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
// Reducer
// ------------------------------------
interface userState {
  userId: number | null
  username: string | null
  name: string | null
  roomId: number | null
  isAdmin: boolean
  dateCreated: number
  dateUpdated: number
}

const initialState: userState = {
  userId: null,
  username: null,
  name: null,
  roomId: null,
  isAdmin: false,
  dateCreated: 0,
  dateUpdated: 0,
}

const userReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(receiveAccount, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(logout.fulfilled, () => ({
      ...initialState,
    }))
    .addCase(SOCKET_AUTH_ERROR, () => ({
      ...initialState,
    }))
})

export default persistReducer({
  key: 'user',
  storage,
}, userReducer)
