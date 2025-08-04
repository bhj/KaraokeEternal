import { createAction, createReducer } from '@reduxjs/toolkit'
import type { QueueItem, OptimisticQueueItem } from 'shared/types'
import {
  QUEUE_ADD,
  QUEUE_MOVE,
  QUEUE_PUSH,
  QUEUE_REMOVE,
  LOGOUT,
} from 'shared/actionTypes'

// ------------------------------------
// Actions
// ------------------------------------
const logout = createAction(LOGOUT)
export const moveItem = createAction<{ queueId: number, prevQueueId: number }>(QUEUE_MOVE)
export const removeItem = createAction<{ queueId: number }>(QUEUE_REMOVE)
export const queuePush = createAction<QueueState>(QUEUE_PUSH)

export const queueSong = createAction(QUEUE_ADD, (songId: number) => ({
  payload: { songId },
  meta: { isOptimistic: true },
}))

// ------------------------------------
// Reducer
// ------------------------------------
interface QueueState {
  isLoading: boolean
  result: number[] // queueIds
  entities: Record<number, QueueItem | OptimisticQueueItem>
}

const initialState: QueueState = {
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
        isOptimistic: true,
      }
    })
    .addCase(queuePush, (state, { payload }) => ({
      isLoading: false,
      result: payload.result,
      entities: payload.entities,
    }))
    .addCase(logout, (state) => {
      state.result = []
      state.entities = {}
    })
})

export default queueReducer
