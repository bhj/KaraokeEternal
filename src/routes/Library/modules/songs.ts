import { createAction, createReducer } from '@reduxjs/toolkit'
import { Song } from 'shared/types'
import {
  LIBRARY_PUSH,
  LIBRARY_PUSH_SONG,
} from 'shared/actionTypes'

const libraryPushSong = createAction<State['entities'][number]>(LIBRARY_PUSH_SONG)
const libraryPush = createAction<{
  songs: State
}>(LIBRARY_PUSH)

// ------------------------------------
// Reducer
// ------------------------------------
interface State {
  result: number[]
  entities: Record<number, Song>
}

const initialState: State = {
  result: [],
  entities: {},
}

const songsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(libraryPush, (_, { payload }) => ({
      result: payload.songs.result,
      entities: payload.songs.entities,
    }))
    .addCase(libraryPushSong, (state, { payload }) => ({
      ...state,
      entities: {
        ...state.entities,
        ...payload,
      },
    }))
})

export default songsReducer
