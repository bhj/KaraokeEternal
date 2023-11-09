import { createReducer } from '@reduxjs/toolkit'
import {
  LIBRARY_PUSH,
} from 'shared/actionTypes'

// ------------------------------------
// Reducer
// ------------------------------------
interface artistsState {
  result: number[]
  entities: object
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
