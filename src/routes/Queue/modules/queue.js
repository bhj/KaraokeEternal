// emitted from server
const QUEUE_CHANGE = 'queue/QUEUE_CHANGE'
const PLAYER_STATUS = 'player/PLAYER_STATUS'

// add to queue
const QUEUE_ADD = 'server/QUEUE_ADD'

export function queueSong(songId) {
  return {
    type: QUEUE_ADD,
    payload: songId,
    meta: {isOptimistic: true},
  }
}

// remove from queue
export const QUEUE_REMOVE = 'server/QUEUE_REMOVE'

export function removeItem(queueId) {
  return {
    type: QUEUE_REMOVE,
    payload: queueId,
    meta: {isOptimistic: true},
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_ADD]: (state, {payload}) => {
    // optimistic
    let songIds = state.songIds.slice()
    songIds.push(payload)

    return {
      ...state,
      songIds,
    }
  },
  [QUEUE_REMOVE]: (state, {payload}) => {
    // optimistic
    let result = state.result.slice()
    result.splice(result.indexOf(payload), 1)

    return {
      ...state,
      result,
    }
  },
  [QUEUE_CHANGE]: (state, {payload}) => ({
    ...state,
    result: payload.result,
    entities: payload.entities,
    songIds: payload.result.map(queueId => payload.entities[queueId].songId)
  }),
  [PLAYER_STATUS]: (state, {payload}) => {
    const { queueId, position } = payload
    let newItems = Object.assign({}, state.entities)

    let wait = 0
    let nextWait = 0

    state.result.forEach(i => {
      const duration = state.entities[i].duration
      if (i === queueId) {
        // currently playing
        nextWait = Math.round(duration - position)
      } else if (i > queueId) {
        wait += nextWait
        nextWait = duration
      }

      newItems[i].wait = wait
    })

    return {
      ...state,
      entities: newItems,
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  result: [],   // item ids
  entities: {}, // keyed by queueId
  songIds: [], // optimistic index for Library lookup
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
