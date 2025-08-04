import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import HttpApi from 'lib/HttpApi'
import { User } from 'shared/types'
import {
  USERS_CREATE,
  USERS_EDITOR_CLOSE,
  USERS_EDITOR_OPEN,
  USERS_FILTER_ONLINE,
  USERS_FILTER_ROOM_ID,
  USERS_REMOVE,
  USERS_REQUEST,
  USERS_UPDATE,
  REDUX_SLICE_INJECT_NOOP,
} from 'shared/actionTypes'

const api = new HttpApi('')

export interface UserWithRoomsAndRole extends User {
  rooms: number[] // roomIds
  role: string
}

// ------------------------------------
// Actions
// ------------------------------------
export const fetchUsers = createAsyncThunk(
  USERS_REQUEST,
  async () => await api.get('users'),
)

export const createUser = createAsyncThunk(
  USERS_CREATE,
  async (data: FormData, thunkAPI) => {
    await api.post('user', {
      body: data,
    })

    thunkAPI.dispatch(fetchUsers())
  },
)

export const updateUser = createAsyncThunk(
  USERS_UPDATE,
  async ({
    userId,
    data,
  }: {
    userId: number
    data: FormData
  }, thunkAPI) => {
    await api.put(`user/${userId}`, {
      body: data,
    })

    thunkAPI.dispatch(fetchUsers())
  },
)

export const removeUser = createAsyncThunk(
  USERS_REMOVE,
  async (userId: number, thunkAPI) => {
    await api.delete(`user/${userId}`)

    thunkAPI.dispatch(fetchUsers())
  },
)

export const openUserEditor = createAction(USERS_EDITOR_OPEN)
export const closeUserEditor = createAction(USERS_EDITOR_CLOSE)
export const filterByOnline = createAction<boolean>(USERS_FILTER_ONLINE)
export const filterByRoom = createAction<number>(USERS_FILTER_ROOM_ID)

// ------------------------------------
// Reducer
// ------------------------------------
interface UsersState {
  result: number[]
  entities: Record<number, UserWithRoomsAndRole>
  filterOnline: boolean
  filterRoomId: number | null
  isEditorOpen: boolean
}

const initialState: UsersState = {
  result: [],
  entities: {},
  filterOnline: true,
  filterRoomId: null,
  isEditorOpen: false,
}

const usersReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(fetchUsers.fulfilled, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(createUser.fulfilled, (state) => {
      state.isEditorOpen = false
    })
    .addCase(updateUser.fulfilled, (state) => {
      state.isEditorOpen = false
    })
    .addCase(removeUser.fulfilled, (state) => {
      state.isEditorOpen = false
    })
    .addCase(openUserEditor, (state) => {
      state.isEditorOpen = true
    })
    .addCase(closeUserEditor, (state) => {
      state.isEditorOpen = false
    })
    .addCase(filterByOnline, (state, { payload }) => ({
      ...state,
      filterOnline: payload,
      filterRoomId: null,
    }))
    .addCase(filterByRoom, (state, { payload }) => ({
      ...state,
      filterOnline: false,
      filterRoomId: payload,
    }))
})

export default usersReducer

declare module 'store/reducers' {
  export interface LazyLoadedSlices {
    users: typeof initialState
  }
}

export const sliceInjectNoOp = createAction(REDUX_SLICE_INJECT_NOOP)
