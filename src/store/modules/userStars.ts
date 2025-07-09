import { createAction, createReducer } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'
import { ensureState } from 'redux-optimistic-ui'
import {
  ACCOUNT_RECEIVE,
  STAR_SONG,
  UNSTAR_SONG,
  SONG_STARRED,
  SONG_UNSTARRED,
  STARS_PUSH,
  SOCKET_AUTH_ERROR,
  LOGOUT,
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

const songStarred = createAction<{ userId: number, songId: number }>(SONG_STARRED)
const songUnstarred = createAction<{ userId: number, songId: number }>(SONG_UNSTARRED)
const starsPush = createAction<State>(STARS_PUSH) // @todo Seems to be unused
const accountReceive = createAction<{ userId: number }>(ACCOUNT_RECEIVE)

// ------------------------------------
// Reducer
// ------------------------------------
interface State {
  userId: number | null
  starredArtists: number[]
  starredSongs: number[]
}

const initialState: State = {
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
    .addCase(songStarred, (state, { payload }) => {
      if (payload.userId === state.userId && !state.starredSongs.includes(payload.songId)) {
        state.starredSongs.push(payload.songId)
      }
    })
    .addCase(songUnstarred, (state, { payload }) => {
      if (payload.userId === state.userId && state.starredSongs.includes(payload.songId)) {
        state.starredSongs.splice(state.starredSongs.indexOf(payload.songId), 1)
      }
    })
    .addCase(starsPush, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(accountReceive, (state, { payload }) => {
      state.userId = payload.userId
    })
    // @ts-expect-error: payload exists; action type appears to be erroneous
    .addCase(REHYDRATE, (state, { payload }) => {
      if (typeof payload?.userId === 'number') {
        state.userId = payload.userId
      }
    })
    .addCase(LOGOUT, () => ({
      ...initialState,
    }))
    .addCase(SOCKET_AUTH_ERROR, () => ({
      ...initialState,
    }))
})

export default userStarsReducer
