import { createAction, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
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
  LOGIN,
  LOGOUT,
  SOCKET_AUTH_ERROR,
  SOCKET_REQUEST_CONNECT,
} from 'shared/actionTypes'

const api = new HttpApi('')
const basename = new URL(document.baseURI).pathname

// ------------------------------------
// State & Slice
// ------------------------------------
interface UserState {
  userId: number | null
  username: string | null
  name: string | null
  roomId: number | null
  ownRoomId: number | null // user's own ephemeral room (null if visiting)
  authProvider: 'local' | 'sso'
  isAdmin: boolean
  isGuest: boolean
  isBootstrapping: boolean
  isLoggingOut: boolean
  dateCreated: number
  dateUpdated: number
}

const initialState: UserState = {
  userId: null,
  username: null,
  name: null,
  roomId: null,
  ownRoomId: null,
  authProvider: 'local',
  isAdmin: false,
  isGuest: false,
  isBootstrapping: true,
  isLoggingOut: false,
  dateCreated: 0,
  dateUpdated: 0,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logoutStart: (state) => {
      state.isLoggingOut = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ACCOUNT_RECEIVE, (state, action: PayloadAction<Partial<UserState>>) => ({
        ...state,
        ...action.payload,
      }))
      .addCase('user/BOOTSTRAP_COMPLETE', (state) => {
        state.isBootstrapping = false
      })
      .addCase(LOGOUT, () => ({
        ...initialState,
        isBootstrapping: false,
        isLoggingOut: false,
      }))
      .addCase(SOCKET_AUTH_ERROR, () => ({
        ...initialState,
        isBootstrapping: false,
      }))
  },
})

// Extract internal actions from slice
const { logoutStart } = userSlice.actions

// Actions with specific action types for socket middleware compatibility
const receiveAccount = createAction<Partial<UserState>>(ACCOUNT_RECEIVE)
export const bootstrapComplete = createAction('user/BOOTSTRAP_COMPLETE')
const requestSocketConnect = createAction<object>(SOCKET_REQUEST_CONNECT)

// ------------------------------------
// Async Thunks
// ------------------------------------
const SESSION_CHECK_TIMEOUT_MS = 5000 // 5 second timeout to prevent perpetual loading

export const checkSession = createAsyncThunk<void, void, { state: RootState }>(
  'user/CHECK_SESSION',
  async (_, thunkAPI) => {
    try {
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error('Session check timeout')), SESSION_CHECK_TIMEOUT_MS)
      })

      const user = await Promise.race([
        api.get('user', { skipAuthRedirect: true }),
        timeoutPromise,
      ])

      thunkAPI.dispatch(receiveAccount(user))
      thunkAPI.dispatch(fetchPrefs())
      thunkAPI.dispatch(connectSocket())
      socket.open()
    } catch {
      // No valid session, timeout, or network error - expected for unauthenticated users
    } finally {
      thunkAPI.dispatch(bootstrapComplete())
    }
  },
)

export const login = createAsyncThunk(
  LOGIN,
  async (creds: object, thunkAPI) => {
    const user = await api.post('login', { body: creds })

    thunkAPI.dispatch(receiveAccount(user))
    thunkAPI.dispatch(fetchPrefs())
    thunkAPI.dispatch(connectSocket())
    socket.open()

    const redirect = new URLSearchParams(window.location.search).get('redirect')
    if (redirect) {
      AppRouter.navigate(basename.replace(/\/$/, '') + redirect)
    }
  },
)

export const requestLogout = createAsyncThunk(
  LOGOUT,
  async (_, thunkAPI) => {
    thunkAPI.dispatch(logoutStart())

    let ssoSignoutUrl: string | null = null

    try {
      const response = await api.post<{ ssoSignoutUrl: string | null }>('logout')
      ssoSignoutUrl = response.ssoSignoutUrl
    } catch {
      // ignore errors
    }

    socket.close()

    if (ssoSignoutUrl) {
      window.location.href = ssoSignoutUrl
    } else {
      window.location.href = '/'
    }
  },
)

export const createAccount = createAsyncThunk<void, FormData, { state: RootState }>(
  ACCOUNT_CREATE,
  async (data: FormData, thunkAPI) => {
    const isFirstRun = thunkAPI.getState().prefs.isFirstRun

    const user = await api.post(isFirstRun ? 'setup' : 'user', { body: data })

    thunkAPI.dispatch(receiveAccount(user))
    thunkAPI.dispatch(fetchPrefs())
    thunkAPI.dispatch(connectSocket())
    socket.open()

    const redirect = new URLSearchParams(window.location.search).get('redirect')
    if (redirect) {
      AppRouter.navigate(basename.replace(/\/$/, '') + redirect)
    }
  },
)

export const updateAccount = createAsyncThunk<void, FormData, { state: RootState }>(
  ACCOUNT_UPDATE,
  async (data: FormData, thunkAPI) => {
    const { userId } = thunkAPI.getState().user

    const user = await api.put(`user/${userId}`, { body: data })

    thunkAPI.dispatch(receiveAccount(user))
    alert('Account updated successfully.')
  },
)

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

// User state is NOT persisted - SSO is the source of truth
// checkSession always fetches fresh user state from server
export default userSlice.reducer
