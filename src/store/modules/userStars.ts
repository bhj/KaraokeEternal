import { createAction, createReducer } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'
import { ensureState } from 'redux-optimistic-ui'
import { logout } from 'store/modules/user'
import {
  ACCOUNT_RECEIVE,
  STAR_SONG,
  UNSTAR_SONG,
  SONG_STARRED,
  SONG_UNSTARRED,
  STARS_PUSH,
  SOCKET_AUTH_ERROR,
} from 'shared/actionTypes'

// ------------------------------------
// Actions
// ------------------------------------
export const toggleSongStarred = (songId: number) => {
  return (dispatch, getState) => {
    const starredSongs = ensureState(getState().userStars).starredSongs
    dispatch(starredSongs.includes(songId) ? unstarSong(songId) : starSong(songId))
  }
}

const starSong = createAction(STAR_SONG, (songId: number) => ({
  payload: { songId },
  meta: { isOptimistic: true },
}))

const unstarSong = createAction(UNSTAR_SONG, (songId: number) => ({
  payload: { songId },
  meta: { isOptimistic: true },
}))

// ------------------------------------
// Reducer
// ------------------------------------
interface userStarsState {
  userId: number | null
  starredArtists: number[]
  starredSongs: number[]
}

const initialState: userStarsState = {
  userId: null,
  starredArtists: [],
  starredSongs: [],
}

const userStarsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(starSong, (state, { payload }) => {
      // optimistic
      state.starredSongs.push(payload.songId)
    })
    .addCase(unstarSong, (state, { payload }) => {
      // optimistic
      state.starredSongs.splice(state.starredSongs.indexOf(payload.songId), 1)
    })
    .addCase(SONG_STARRED, (state, { payload }) => {
      if (payload.userId === state.userId && !state.starredSongs.includes(payload.songId)) {
        state.starredSongs.push(payload.songId)
      }
    })
    .addCase(SONG_UNSTARRED, (state, { payload }) => {
      if (payload.userId === state.userId && state.starredSongs.includes(payload.songId)) {
        state.starredSongs.splice(state.starredSongs.indexOf(payload.songId), 1)
      }
    })
    .addCase(STARS_PUSH, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(ACCOUNT_RECEIVE, (state, { payload }) => {
      state.userId = payload.userId
    })
    .addCase(REHYDRATE, (state, { payload }) => {
      if (typeof payload?.userId === 'number') {
        state.userId = payload.userId
      }
    })
    .addCase(logout.fulfilled, () => ({
      ...initialState,
    }))
    .addCase(SOCKET_AUTH_ERROR, () => ({
      ...initialState,
    }))
})

export default userStarsReducer
