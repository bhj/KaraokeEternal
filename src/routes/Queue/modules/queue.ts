import { createAction, createReducer } from '@reduxjs/toolkit'
import { logout } from 'store/modules/user'
import { QueueItem } from 'shared/types'
import {
  QUEUE_ADD,
  QUEUE_MOVE,
  QUEUE_PUSH,
  QUEUE_REMOVE,
} from 'shared/actionTypes'

// ------------------------------------
// Actions
// ------------------------------------
export const moveItem = createAction<{ queueId: number; prevQueueId: number }>(QUEUE_MOVE)
export const removeItem = createAction<number>(QUEUE_REMOVE)

export const queueSong = createAction(QUEUE_ADD, (songId: number) => ({
  payload: { songId },
  meta: { isOptimistic: true },
}))

// ------------------------------------
// Reducer
// ------------------------------------
interface queueState {
  isLoading: boolean
  result: PropertyKey[] // queueIds
  entities: Record<PropertyKey, QueueItem>
}

const initialState: queueState = {
  isLoading: true,
  result: [],
  entities: {},
}

const queueReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(queueSong, (state, { payload }) => {
      // optimistic
      const nextQueueId = state.result.length ? (state.result[state.result.length - 1] as number) + 1 : 1

      state.result.push(nextQueueId)
      state.entities[nextQueueId] = {
        ...payload,
        queueId: nextQueueId,
        prevQueueId: nextQueueId - 1 || null,
        isOptimistic: true
      }
    })
    .addCase(QUEUE_PUSH, (state, { payload }) => ({
      isLoading: false,
      result: payload.result,
      entities: payload.entities,
    }))
    .addCase(logout.fulfilled, (state) => {
      state.result = []
      state.entities = {}
    })
})

export default queueReducer
