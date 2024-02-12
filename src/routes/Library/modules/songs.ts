import { createReducer } from '@reduxjs/toolkit'
import { Song } from 'shared/types'
import {
  LIBRARY_PUSH,
  LIBRARY_PUSH_SONG,
} from 'shared/actionTypes'

// ------------------------------------
// Reducer
// ------------------------------------
interface songsState {
  result: number[]
  entities: Record<number, Song>
}

const initialState: songsState = {
  result: [],
  entities: {},
}

const songsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(LIBRARY_PUSH, (_, { payload }) => ({
      result: payload.songs.result,
      entities: payload.songs.entities,
    }))
    .addCase(LIBRARY_PUSH_SONG, (state, { payload }) => ({
      ...state,
      entities: {
        ...state.entities,
        ...payload,
      }
    }))
})

export default songsReducer
