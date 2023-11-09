import { createReducer } from '@reduxjs/toolkit'
import {
  SONG_STARRED,
  SONG_UNSTARRED,
  STAR_COUNTS_PUSH,
} from 'shared/actionTypes'

// ------------------------------------
// Reducer
// ------------------------------------
interface startCountsState {
  artists: object
  songs: object
  version: number
}

const initialState: startCountsState = {
  artists: {},
  songs: {},
  version: 0,
}

const starCountsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(SONG_STARRED, (state, { payload }) => {
      state.songs[payload.songId] = state.songs[payload.songId] + 1 || 1
    })
    .addCase(SONG_UNSTARRED, (state, { payload }) => {
      state.songs[payload.songId] = Math.max(state.songs[payload.songId] - 1, 0)
    })
    .addCase(STAR_COUNTS_PUSH, (state, { payload }) => ({
      ...payload,
    }))
})

export default starCountsReducer
