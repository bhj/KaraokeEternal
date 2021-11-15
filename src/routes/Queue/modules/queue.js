import {
  LOGOUT,
  QUEUE_ADD,
  QUEUE_MOVE,
  QUEUE_PUSH,
  QUEUE_REMOVE,
  _SUCCESS,
} from 'shared/actionTypes'

// set an item's prevQueueId
export function moveItem (queueId, prevQueueId) {
  return {
    type: QUEUE_MOVE,
    payload: { queueId, prevQueueId },
  }
}

// add to queue
export function queueSong (songId) {
  return (dispatch, getState) => {
    dispatch({
      type: QUEUE_ADD,
      meta: { isOptimistic: true },
      payload: { songId },
    })
  }
}

// remove from queue
export function removeItem (queueId) {
  return {
    type: QUEUE_REMOVE,
    payload: { queueId },
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LOGOUT + _SUCCESS]: (state, { payload }) => ({
    result: [],
    entities: {},
  }),
  [QUEUE_ADD]: (state, { payload }) => {
    // optimistic
    const nextQueueId = state.result.length ? state.result[state.result.length - 1] + 1 : 1

    return {
      ...state,
      result: [...state.result, nextQueueId],
      entities: {
        ...state.entities,
        [nextQueueId]: {
          ...payload,
          queueId: nextQueueId,
          prevQueueId: nextQueueId - 1 || null,
          isOptimistic: true
        },
      }
    }
  },
  [QUEUE_PUSH]: (state, { payload }) => ({
    isLoading: false,
    result: payload.result,
    entities: payload.entities,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isLoading: true,
  result: [], // queueIds
  entities: {}, // keyed by queueId
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
