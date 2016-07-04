// emitted from server
const QUEUE_UPDATE = 'server/QUEUE_UPDATE'
const QUEUE_ERROR = 'server/QUEUE_ERROR'

// ------------------------------------
// add to queue
// ------------------------------------
const QUEUE_ADD = 'server/QUEUE_ADD'

export function addSong(uid) {
  return {
    type: QUEUE_ADD,
    payload: uid
  }
}

// ------------------------------------
// remove from queue
// ------------------------------------
export const QUEUE_REMOVE = 'server/QUEUE_REMOVE'

export function removeItem(id) {
  return {
    type: QUEUE_REMOVE,
    payload: id
  }
}

// ------------------------------------
// Next item in queue
// ------------------------------------
export function playNext() {
  return (dispatch, getState) => {
    const { queue } = getState()

    // is the queue empty?
    if (!queue.result.queueIds.length) {
      console.log('empty')
      dispatch(end())
      return
    }

    // just starting?
    if (queue.playingId === null) {
      dispatch(play(queue.result.queueIds[0]))
      return
    }

    let qIndex = queue.result.queueIds.indexOf(queue.playingId)

    if (qIndex === -1) {
      console.log('playNext(): queue id %s is not in queue', queue.playingId)
      return
      // @todo
    }

    if (qIndex === queue.result.queueIds.length-1) {
      console.log('eol')
      dispatch(end())
      return
    }

    dispatch(play(queue.result.queueIds[qIndex+1]))
  }
}

// ------------------------------------
// Playback controls
// ------------------------------------
export const PLAY = 'queue/PLAY'
export const PAUSE = 'queue/PAUSE'
export const END = 'queue/END'

export function play(queueId) {
  return {
    type: PLAY,
    payload: queueId
  }
}
export function pause() {
  return {
    type: PAUSE,
    payload: null
  }
}

export function end() {
  return {
    type: END,
    payload: null
  }
}


// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_UPDATE]: (state, {payload}) => ({
    ...state,
    result: payload.result,
    entities: payload.entities
  }),
  [QUEUE_ERROR]: (state, {payload}) => ({
    ...state,
    errorMessage: payload.message
  }),
  // playback control
  [PLAY]: (state, {payload}) => ({
    ...state,
    isPlaying: true,
    playingId: payload
  }),
  [PAUSE]: (state, {payload}) => ({
    ...state,
    isPlaying: false
  }),
  [END]: (state, {payload}) => ({
    ...state,
    isPlaying: false
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isPlaying: false,
  playingId: null,
  isFetching: false,
  errorMessage: null,
  result: {queueIds: [], uids: []},
  entities: {}
}

export default function queueReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
