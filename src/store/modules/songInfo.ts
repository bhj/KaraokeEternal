import { createAction, createAsyncThunk, createReducer } from '@reduxjs/toolkit'
import HttpApi from 'lib/HttpApi'
import {
  SONG_INFO_REQUEST,
  SONG_INFO_SET_PREFERRED,
  SONG_INFO_CLOSE,
} from 'shared/actionTypes'
import { Media } from 'shared/types'

const api = new HttpApi()

// ------------------------------------
// Actions
// ------------------------------------
export const showSongInfo = createAsyncThunk(
  SONG_INFO_REQUEST,
  async (songId: number) => await api.get<{ result: number[], entities: Media[] }>(`song/${songId}`),
)

export const closeSongInfo = createAction(SONG_INFO_CLOSE)

export const setPreferredSong = createAsyncThunk(
  SONG_INFO_SET_PREFERRED,
  async ({
    songId,
    mediaId,
    isPreferred,
  }: Pick<Media, 'songId' | 'mediaId' | 'isPreferred'>, thunkAPI) => {
    await api.request(isPreferred ? 'PUT' : 'DELETE', `media/${mediaId}/prefer`)
    thunkAPI.dispatch(showSongInfo(songId))
  },
)

// ------------------------------------
// Reducer
// ------------------------------------
export interface SongInfoState {
  isLoading: boolean
  isVisible: boolean
  songId: number | null
  media: { result: number[], entities: Record<number, Media> }
}

const initialState: SongInfoState = {
  isLoading: false,
  isVisible: false,
  songId: null,
  media: { result: [], entities: {} },
}

const songInfoReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(showSongInfo.pending, (state, { meta }) => {
      state.isLoading = true
      state.isVisible = true
      state.songId = meta.arg
    })
    .addCase(showSongInfo.fulfilled, (state, { payload }) => {
      state.isLoading = false
      state.media = payload
    })
    .addCase(showSongInfo.rejected, (state) => {
      state.isLoading = false
      state.isVisible = false
    })
    .addCase(closeSongInfo, (state) => {
      state.isVisible = false
    })
})

export default songInfoReducer
