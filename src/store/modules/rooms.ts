import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import { logout } from 'store/modules/user'
import { Room } from 'shared/types'
import {
  ROOMS_RECEIVE,
  ROOMS_REQUEST,
  ROOM_EDITOR_OPEN,
  ROOM_EDITOR_CLOSE,
  ROOM_FILTER_STATUS,
  ROOM_UPDATE,
  ROOM_CREATE,
  ROOM_REMOVE,
} from 'shared/actionTypes'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('rooms')

// ------------------------------------
// Actions
// ------------------------------------
export const receiveRooms = createAction<object>(ROOMS_RECEIVE)

export const fetchRooms = createAsyncThunk(
  ROOMS_REQUEST,
  async () => await api('GET', '')
)

export const createRoom = createAsyncThunk(
  ROOM_CREATE,
  async (data: FormData, thunkAPI) => {
    const response = await api('POST', '', {
      body: data
    })

    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  }
)

export const updateRoom = createAsyncThunk(
  ROOM_UPDATE,
  async ({
    roomId,
    data
  }: {
    roomId: number
    data: FormData
  }, thunkAPI) => {
    const response = await api('PUT', `/${roomId}`, {
      body: data
    })

    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  }
)

export const removeRoom = createAsyncThunk(
  ROOM_REMOVE,
  async (roomId: number, thunkAPI) => {
    const response = await api('DELETE', `/${roomId}`)

    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  }
)

export const openRoomEditor = createAction(ROOM_EDITOR_OPEN)
export const closeRoomEditor = createAction(ROOM_EDITOR_CLOSE)
export const filterByStatus = createAction<boolean | string>(ROOM_FILTER_STATUS)

// ------------------------------------
// Reducer
// ------------------------------------
interface roomsState {
  result: PropertyKey[]
  entities: Record<PropertyKey, Room>
  filterStatus: boolean | string
  isEditorOpen: boolean
}

const initialState:roomsState = {
  result: [],
  entities: {},
  filterStatus: 'open',
  isEditorOpen: false,
}

const roomsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(fetchRooms.fulfilled, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(receiveRooms, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(openRoomEditor, (state) => {
      state.isEditorOpen = true
    })
    .addCase(closeRoomEditor, (state) => {
      state.isEditorOpen = false
    })
    .addCase(filterByStatus, (state, { payload }) => {
      state.filterStatus = payload
    })
    .addCase(logout.fulfilled, () => ({
      ...initialState,
    }))
})

export default roomsReducer
