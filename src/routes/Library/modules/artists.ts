import { createReducer } from '@reduxjs/toolkit'
import { Artist } from 'shared/types'
import {
  LIBRARY_PUSH,
} from 'shared/actionTypes'

// ------------------------------------
// Reducer
// ------------------------------------
interface artistsState {
  result: PropertyKey[]
  entities: Record<PropertyKey, Artist>
}

const initialState: artistsState = {
  result: [],
  entities: {},
}

const artistsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(LIBRARY_PUSH, (state, { payload }) => ({
      result: payload.artists.result,
      entities: payload.artists.entities,
    }))
})

export default artistsReducer
