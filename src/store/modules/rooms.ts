import { createAction, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppThunk, RootState } from 'store/store'
import type { IRoomPrefs, Room } from 'shared/types'
import {
  ROOMS_RECEIVE,
  ROOMS_REQUEST,
  ROOM_EDITOR_OPEN,
  ROOM_EDITOR_CLOSE,
  ROOM_FILTER_STATUS,
  ROOM_UPDATE,
  ROOM_CREATE,
  ROOM_REMOVE,
  ROOM_PREFS_PUSH,
  ROOM_PREFS_PUSH_REQUEST,
  LOGOUT,
} from 'shared/actionTypes'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('rooms')

// ------------------------------------
// State & Slice
// ------------------------------------
interface RoomsState {
  result: number[]
  entities: Record<number, Room>
  filterStatus: boolean | string
  isEditorOpen: boolean
}

const initialState: RoomsState = {
  result: [],
  entities: {},
  filterStatus: 'open',
  isEditorOpen: false,
}

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ROOMS_REQUEST + '/fulfilled', (state, action: PayloadAction<Partial<RoomsState>>) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(ROOMS_RECEIVE, (state, action: PayloadAction<Partial<RoomsState>>) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(ROOM_EDITOR_OPEN, (state) => {
        state.isEditorOpen = true
      })
      .addCase(ROOM_EDITOR_CLOSE, (state) => {
        state.isEditorOpen = false
      })
      .addCase(ROOM_FILTER_STATUS, (state, action: PayloadAction<boolean | string>) => {
        state.filterStatus = action.payload
      })
      .addCase(ROOM_PREFS_PUSH, (state, action: PayloadAction<{ roomId: number, prefs: IRoomPrefs }>) => {
        const { roomId, prefs } = action.payload
        if (state.entities[roomId]) {
          state.entities[roomId].prefs = prefs
        }
      })
      .addCase(LOGOUT, () => initialState)
  },
})

// Actions with specific action types for socket middleware compatibility
export const receiveRooms = createAction<Partial<RoomsState>>(ROOMS_RECEIVE)
export const openRoomEditor = createAction(ROOM_EDITOR_OPEN)
export const closeRoomEditor = createAction(ROOM_EDITOR_CLOSE)
export const filterByStatus = createAction<boolean | string>(ROOM_FILTER_STATUS)

// ------------------------------------
// Async Thunks
// ------------------------------------
export const fetchRooms = createAsyncThunk(
  ROOMS_REQUEST,
  async () => await api.get(''),
)

export const fetchCurrentRoom = createAsyncThunk<object, void, { state: RootState }>(
  ROOMS_REQUEST,
  async (_, thunkAPI) => {
    const roomId = thunkAPI.getState().user.roomId

    if (typeof roomId !== 'number') {
      return Promise.reject(new Error('Please sign into a room'))
    }

    return await api.get(`/${roomId}`)
  },
)

export const createRoom = createAsyncThunk(
  ROOM_CREATE,
  async (data: object, thunkAPI) => {
    const response = await api.post('', { body: data })
    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const updateRoom = createAsyncThunk(
  ROOM_UPDATE,
  async ({ roomId, data }: { roomId: number, data: object }, thunkAPI) => {
    const response = await api.put(`/${roomId}`, { body: data })
    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const removeRoom = createAsyncThunk(
  ROOM_REMOVE,
  async (roomId: number, thunkAPI) => {
    const response = await api.delete(`/${roomId}`)
    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const joinRoom = createAsyncThunk(
  'rooms/join',
  async (roomId: number) => {
    await api.post(`/${roomId}/join`)

    // Clear the roomId param BEFORE reload to prevent modal loop
    const url = new URL(window.location.href)
    url.searchParams.delete('roomId')
    window.history.replaceState({}, '', url.toString())

    window.location.reload()
  },
)

export const leaveRoom = createAsyncThunk(
  'rooms/leave',
  async () => {
    await api.post('/leave')
    window.location.reload()
  },
)

// ------------------------------------
// AppThunk
// ------------------------------------
export function requestPrefsPush (roomId: number, prefs: IRoomPrefs): AppThunk {
  return (dispatch) => {
    dispatch({
      type: ROOM_PREFS_PUSH_REQUEST,
      payload: { roomId, prefs },
      meta: {
        throttle: {
          wait: 200,
          leading: true,
        },
      },
    })
  }
}

export default roomsSlice.reducer
