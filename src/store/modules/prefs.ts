import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import {
  PREFS_RECEIVE,
  PREFS_REQUEST,
  PREFS_SET,
  PREFS_SET_PATH_PRIORITY,
  PREFS_PUSH,
  PREFS_REQ_SCANNER_START,
  PREFS_REQ_SCANNER_STOP,
  SCANNER_WORKER_STATUS,
} from 'shared/actionTypes'

import { logout } from './user'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('prefs')

// ------------------------------------
// Actions
// ------------------------------------
export const setPref = createAction<{ key: string; data: unknown }>(PREFS_SET)
export const receivePrefs = createAction<object>(PREFS_RECEIVE)
export const setPathPriority = createAction<number[]>(PREFS_SET_PATH_PRIORITY)

export const fetchPrefs = createAsyncThunk(
  PREFS_REQUEST,
  async (_, thunkAPI) => {
    const response = await api('GET', '')

    // sign out if we see isFirstRun flag
    if (response.isFirstRun && thunkAPI.getState().user.userId !== null) {
      thunkAPI.dispatch(logout())
    }

    return response
  }
)

export const requestScan = createAsyncThunk(
  PREFS_REQ_SCANNER_START,
  async () => api('GET', '/scan')
)

export const requestScanStop = createAsyncThunk(
  PREFS_REQ_SCANNER_STOP,
  async () => api('GET', '/scan')
)

// ------------------------------------
// Reducer
// ------------------------------------
interface prefsState {
  isScanning: boolean
  isReplayGainEnabled: boolean
  paths: { result: number[]; entities: object }
  scannerPct: number
  scannerText: string
}

const initialState: prefsState = {
  isScanning: false,
  isReplayGainEnabled: false,
  paths: { result: [], entities: {} },
  scannerPct: 0,
  scannerText: '',
}

const prefsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(fetchPrefs.fulfilled, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(receivePrefs, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(PREFS_PUSH, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(SCANNER_WORKER_STATUS, (state, { payload }) => ({
      ...state,
      isScanning: payload.isScanning,
      scannerPct: payload.pct,
      scannerText: payload.text,
    }))
})

export default prefsReducer
