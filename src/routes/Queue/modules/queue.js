import {
  QUEUE_ADD,
  QUEUE_PUSH,
  QUEUE_REMOVE,
} from 'constants/actions'

// add to queue
export function queueSong (songId) {
  return (dispatch, getState) => {
    dispatch({
      type: QUEUE_ADD,
      payload: {
        mediaId: getState().songs.entities[songId].mediaId
      },
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
  [QUEUE_PUSH]: (state, { payload }) => ({
    ...state,
    result: payload.result,
    entities: payload.entities,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [], // queueIds
  entities: {}, // keyed by queueId
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
