import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import { AppThunk, RootState } from 'store/store'
import type { Room } from 'shared/types'
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
// Actions
// ------------------------------------
export const receiveRooms = createAction<object>(ROOMS_RECEIVE)

export const fetchRooms = createAsyncThunk(
  ROOMS_REQUEST,
  async () => await api('GET', ''),
)

export const fetchCurrentRoom = createAsyncThunk<object, void, { state: RootState }>(
  ROOMS_REQUEST,
  async (_, thunkAPI) => {
    const roomId = thunkAPI.getState().user.roomId

    if (typeof roomId !== 'number') {
      return Promise.reject('Please sign into a room')
    }

    return await api('GET', `/${roomId}`)
  },
)

export const createRoom = createAsyncThunk(
  ROOM_CREATE,
  async (data: object, thunkAPI) => {
    const response = await api('POST', '', {
      body: data,
    })

    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const updateRoom = createAsyncThunk(
  ROOM_UPDATE,
  async ({
    roomId,
    data,
  }: {
    roomId: number
    data: object
  }, thunkAPI) => {
    const response = await api('PUT', `/${roomId}`, {
      body: data,
    })

    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const removeRoom = createAsyncThunk(
  ROOM_REMOVE,
  async (roomId: number, thunkAPI) => {
    const response = await api('DELETE', `/${roomId}`)

    thunkAPI.dispatch(receiveRooms(response))
    thunkAPI.dispatch(closeRoomEditor())
  },
)

export const openRoomEditor = createAction(ROOM_EDITOR_OPEN)
export const closeRoomEditor = createAction(ROOM_EDITOR_CLOSE)
export const filterByStatus = createAction<boolean | string>(ROOM_FILTER_STATUS)

export function requestPrefsPush (roomId, prefs): AppThunk {
  return (dispatch) => {
    dispatch({
      type: ROOM_PREFS_PUSH_REQUEST,
      payload: {
        roomId,
        prefs,
      },
      meta: {
        throttle: {
          wait: 200,
          leading: true,
        },
      },
    })
  }
}

// ------------------------------------
// Reducer
// ------------------------------------
interface roomsState {
  result: number[]
  entities: Record<number, Room>
  filterStatus: boolean | string
  isEditorOpen: boolean
}

const initialState: roomsState = {
  result: [],
  entities: {},
  filterStatus: 'open',
  isEditorOpen: false,
}

const roomsReducer = createReducer(initialState, (builder) => {
  builder
    // handles both fetchRooms and fetchCurrentRoom
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
    .addCase(ROOM_PREFS_PUSH, (state, { payload }) => {
      const roomId = payload.roomId

      if (state.entities[roomId]) {
        state.entities[roomId].prefs = payload.prefs
      }
    })
    .addCase(LOGOUT, () => ({
      ...initialState,
    }))
})

export default roomsReducer
