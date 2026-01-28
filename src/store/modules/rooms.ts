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
export interface RoomsState {
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

// Actions with specific action types for socket middleware compatibility
export const receiveRooms = createAction<Partial<RoomsState>>(ROOMS_RECEIVE)
export const openRoomEditor = createAction(ROOM_EDITOR_OPEN)
export const closeRoomEditor = createAction(ROOM_EDITOR_CLOSE)
export const filterByStatus = createAction<boolean | string>(ROOM_FILTER_STATUS)

// Internal action creators for extraReducers (defined before slice)
const roomPrefsPushInternal = createAction<{ roomId: number, prefs: IRoomPrefs }>(ROOM_PREFS_PUSH)
const logoutInternal = createAction(LOGOUT)

// Async Thunks (defined before slice so we can use .fulfilled in extraReducers)
export const fetchRooms = createAsyncThunk<Partial<RoomsState>>(
  ROOMS_REQUEST,
  async () => await api.get<Partial<RoomsState>>(''),
)

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.fulfilled, (state, action) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(receiveRooms, (state, action: PayloadAction<Partial<RoomsState>>) => ({
        ...state,
        ...action.payload,
      }))
      .addCase(openRoomEditor, (state) => {
        state.isEditorOpen = true
      })
      .addCase(closeRoomEditor, (state) => {
        state.isEditorOpen = false
      })
      .addCase(filterByStatus, (state, action) => {
        state.filterStatus = action.payload
      })
      .addCase(roomPrefsPushInternal, (state, action) => {
        const { roomId, prefs } = action.payload
        if (state.entities[roomId]) {
          state.entities[roomId].prefs = prefs
        }
      })
      .addCase(logoutInternal, () => initialState)
  },
})

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
  async (data: Record<string, unknown>, thunkAPI) => {
    const response = await api.post('', { body: data })
    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const updateRoom = createAsyncThunk(
  ROOM_UPDATE,
  async ({ roomId, data }: { roomId: number, data: Record<string, unknown> }, thunkAPI) => {
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
