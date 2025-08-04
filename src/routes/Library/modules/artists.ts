import { createAction, createReducer } from '@reduxjs/toolkit'
import { Artist } from 'shared/types'
import {
  LIBRARY_PUSH,
} from 'shared/actionTypes'

const libraryPush = createAction<{
  artists: ArtistsState
}>(LIBRARY_PUSH)

// ------------------------------------
// Reducer
// ------------------------------------
interface ArtistsState {
  result: number[]
  entities: Record<number, Artist>
}

const initialState: ArtistsState = {
  result: [],
  entities: {},
}

const artistsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(libraryPush, (_, { payload }) => ({
      result: payload.artists.result,
      entities: payload.artists.entities,
    }))
})

export default artistsReducer
