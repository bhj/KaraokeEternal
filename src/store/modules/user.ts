import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import socket from 'lib/socket'
import AppRouter from 'lib/AppRouter'
import { RootState } from 'store/store'
import HttpApi from 'lib/HttpApi'
import { fetchPrefs } from './prefs'
import {
  ACCOUNT_RECEIVE,
  ACCOUNT_REQUEST,
  ACCOUNT_CREATE,
  ACCOUNT_UPDATE,
  BOOTSTRAP_COMPLETE,
  LOGIN,
  LOGOUT,
  SOCKET_AUTH_ERROR,
  SOCKET_REQUEST_CONNECT,
} from 'shared/actionTypes'

const api = new HttpApi('')
const basename = new URL(document.baseURI).pathname

const receiveAccount = createAction<object>(ACCOUNT_RECEIVE)
export const bootstrapComplete = createAction(BOOTSTRAP_COMPLETE)

// ------------------------------------
// Check for existing SSO session on bootstrap
// ------------------------------------
const SESSION_CHECK_TIMEOUT_MS = 5000 // 5 second timeout to prevent perpetual loading

export const checkSession = createAsyncThunk<void, void, { state: RootState }>(
  'user/CHECK_SESSION',
  async (_, thunkAPI) => {
    try {
      // Create a timeout promise to prevent perpetual loading if server is unreachable
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session check timeout')), SESSION_CHECK_TIMEOUT_MS)
      })

      // Race between the actual API call and the timeout
      const user = await Promise.race([
        api.get('user'),
        timeoutPromise,
      ])

      // Server returned valid user - we have a session from SSO header auth
      thunkAPI.dispatch(receiveAccount(user))
      thunkAPI.dispatch(fetchPrefs())
      thunkAPI.dispatch(connectSocket())
      socket.open()
    } catch {
      // No valid session, timeout, or network error - expected for users without SSO/header auth
    } finally {
      thunkAPI.dispatch(bootstrapComplete())
    }
  },
)

// ------------------------------------
// Login
// ------------------------------------
export const login = createAsyncThunk(
  LOGIN,
  async (creds: object, thunkAPI) => {
    // calls api endpoint that should set an httpOnly cookie with
    // our JWT, then establish the sockiet.io connection
    const user = await api.post('login', {
      body: creds,
    })

    thunkAPI.dispatch(receiveAccount(user))
    thunkAPI.dispatch(fetchPrefs())
    thunkAPI.dispatch(connectSocket())
    socket.open()

    // redirect in query string?
    const redirect = new URLSearchParams(window.location.search).get('redirect')

    if (redirect) {
      AppRouter.navigate(basename.replace(/\/$/, '') + redirect)
    }
  },
)

// ------------------------------------
// Logout
// ------------------------------------
const logout = createAction(LOGOUT)

export const requestLogout = createAsyncThunk(
  LOGOUT,
  async (_, thunkAPI) => {
    let ssoSignoutUrl: string | null = null

    try {
      // server response should clear our cookie and return SSO signout URL if configured
      const response = await api.get<{ ssoSignoutUrl: string | null }>('logout')
      ssoSignoutUrl = response.ssoSignoutUrl
    } catch {
      // ignore errors
    }

    thunkAPI.dispatch(logout())
    socket.close()

    // If SSO is configured, redirect to IdP signout to terminate the SSO session
    // This prevents the "logout loop" where SSO re-authenticates immediately
    if (ssoSignoutUrl) {
      window.location.href = ssoSignoutUrl
    }
  },
)

// ------------------------------------
// Create account
// ------------------------------------
export const createAccount = createAsyncThunk<void, FormData, { state: RootState }>(
  ACCOUNT_CREATE,
  async (data: FormData, thunkAPI) => {
    const isFirstRun = thunkAPI.getState().prefs.isFirstRun

    const user = await api.post(isFirstRun ? 'setup' : 'user', {
      body: data,
    })

    thunkAPI.dispatch(receiveAccount(user))
    thunkAPI.dispatch(fetchPrefs())
    thunkAPI.dispatch(connectSocket())
    socket.open()

    // redirect in query string?
    const redirect = new URLSearchParams(window.location.search).get('redirect')

    if (redirect) {
      AppRouter.navigate(basename.replace(/\/$/, '') + redirect)
    }
  },
)

// ------------------------------------
// Update account
// ------------------------------------
export const updateAccount = createAsyncThunk<void, FormData, { state: RootState }>(
  ACCOUNT_UPDATE,
  async (data: FormData, thunkAPI) => {
    const { userId } = thunkAPI.getState().user

    const user = await api.put(`user/${userId}`, {
      body: data,
    })

    thunkAPI.dispatch(receiveAccount(user))
    alert('Account updated successfully.')
  },
)

// ------------------------------------
// Request account (does not refresh JWT)
// ------------------------------------
export const fetchAccount = createAsyncThunk(
  ACCOUNT_REQUEST,
  async (_, thunkAPI) => {
    try {
      const user = await api.get('user')
      thunkAPI.dispatch(receiveAccount(user))
    } catch {
      // ignore errors
    }
  },
)

// ------------------------------------
// Socket actions
// ------------------------------------
const requestSocketConnect = createAction<object>(SOCKET_REQUEST_CONNECT)

export const connectSocket = createAsyncThunk<void, void, { state: RootState }>(
  'user/SOCKET_CONNECT',
  async (_, { dispatch, getState }) => {
    const versions = {
      library: getState().library.version,
      stars: getState().starCounts.version,
    }

    dispatch(requestSocketConnect(versions))
    socket.io.opts.query = versions
  },
)

// ------------------------------------
// Reducer
// ------------------------------------
interface UserState {
  userId: number | null
  username: string | null
  name: string | null
  roomId: number | null
  ownRoomId: number | null // user's own ephemeral room (null if visiting)
  isAdmin: boolean
  isGuest: boolean
  isBootstrapping: boolean
  dateCreated: number
  dateUpdated: number
}

const initialState: UserState = {
  userId: null,
  username: null,
  name: null,
  roomId: null,
  ownRoomId: null,
  isAdmin: false,
  isGuest: false,
  isBootstrapping: true,
  dateCreated: 0,
  dateUpdated: 0,
}

const userReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(receiveAccount, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(bootstrapComplete, (state) => ({
      ...state,
      isBootstrapping: false,
    }))
    .addCase(LOGOUT, () => ({
      ...initialState,
      isBootstrapping: false,
    }))
    .addCase(SOCKET_AUTH_ERROR, () => ({
      ...initialState,
      isBootstrapping: false,
    }))
})

// User state is NOT persisted - SSO is the source of truth
// checkSession always fetches fresh user state from server
export default userReducer
