import { createAction, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/store'
import type { Path, Role } from 'shared/types'
import {
  PREFS_RECEIVE,
  PREFS_REQUEST,
  PREFS_SET,
  PREFS_PATH_UPDATE,
  PREFS_PATH_SET_PRIORITY,
  PREFS_PUSH,
  PREFS_REQ_SCANNER_START,
  PREFS_REQ_SCANNER_STOP,
  SCANNER_WORKER_STATUS,
  LOGOUT,
} from 'shared/actionTypes'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('prefs')

// ------------------------------------
// State & Slice
// ------------------------------------
export interface PrefsState {
  isFirstRun?: boolean
  isScanning: boolean
  isReplayGainEnabled: boolean
  paths: {
    result: number[]
    entities: Record<number, Path>
  }
  roles: {
    result: number[]
    entities: Record<number, Role>
  }
  scannerPct: number
  scannerText: string
}

const initialState: PrefsState = {
  isScanning: false,
  isReplayGainEnabled: false,
  paths: {
    result: [],
    entities: {},
  },
  roles: {
    result: [],
    entities: {},
  },
  scannerPct: 0,
  scannerText: '',
}

// Actions with specific action types for socket middleware compatibility
const logout = createAction(LOGOUT)
export const setPref = createAction<{ key: string, data: unknown }>(PREFS_SET)
export const receivePrefs = createAction<Partial<PrefsState>>(PREFS_RECEIVE)
export const setPathPriority = createAction<number[]>(PREFS_PATH_SET_PRIORITY)

// Internal action creators for extraReducers (defined before slice)
const prefsPushInternal = createAction<Partial<PrefsState>>(PREFS_PUSH)
const scannerStatusInternal = createAction<{ isScanning: boolean, pct: number, text: string }>(SCANNER_WORKER_STATUS)

// Async Thunks (defined before slice so we can use .fulfilled in extraReducers)
export const fetchPrefs = createAsyncThunk<Partial<PrefsState>, void, { state: RootState }>(
  PREFS_REQUEST,
  async (_, thunkAPI) => {
    const response = await api.get<Partial<PrefsState>>('', { skipAuthRedirect: true })

    // sign out if we see isFirstRun flag
    if (response.isFirstRun && thunkAPI.getState().user.userId !== null) {
      thunkAPI.dispatch(logout())
    }

    return response
  },
)

export const setPathPrefs = createAsyncThunk(
  PREFS_PATH_UPDATE,
  async ({ pathId, data }: { pathId: number, data: FormData }, thunkAPI) => {
    const response = await api.put(`/path/${pathId}`, { body: data })
    thunkAPI.dispatch(receivePrefs(response))
  },
)

const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrefs.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(receivePrefs, (state, action: PayloadAction<Partial<PrefsState>>) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(prefsPushInternal, (state, action: PayloadAction<Partial<PrefsState>>) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(scannerStatusInternal, (state, action) => ({
        ...state,
        isScanning: action.payload.isScanning,
        scannerPct: action.payload.pct,
        scannerText: action.payload.text,
      }))
  },
})

export const requestScan = createAsyncThunk(
  PREFS_REQ_SCANNER_START,
  async (pathId: number) => await api.get(`/path/${pathId}/scan`),
)

export const requestScanAll = createAsyncThunk(
  PREFS_REQ_SCANNER_START,
  async () => await api.get('/paths/scan'),
)

export const requestScanStop = createAsyncThunk(
  PREFS_REQ_SCANNER_STOP,
  async () => await api.get('/paths/scan/stop'),
)

export default prefsSlice.reducer
