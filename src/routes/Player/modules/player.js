// ------------------------------------
// Constants
// ------------------------------------
export const PLAY = 'player/PLAY';
export const PAUSE = 'player/PAUSE';
export const END = 'player/END';
export const LOAD = 'player/LOAD';
export const LOAD_SUCCESS = 'player/LOAD_SUCCESS';
export const LOAD_FAIL = 'player/LOAD_FAIL';

// ------------------------------------
// Actions
// ------------------------------------
export const play = () => {
  console.log('PLAYEEEEE')
  return {
    type: PLAY,
    payload: null
  }
}
export const pause = () => {
  console.log('PAAAUUUUUUUUUSE')
  return {
    type: PAUSE,
    payload: null
  }
}
export const end = () => ({
  type: END,
  payload: null // current audio id?
});

export const load = (audioUrl, cdgUrl) => ({
  type: LOAD,
  payload: {audioUrl, cdgUrl}
});

export const loadSuccess = () => ({
  type: LOAD_SUCCESS,
  payload: null
});

export const loadFail = (error) => ({
  type: LOAD_FAIL,
  payload: error
});

export const actions = {
  play,
  pause,
  end,
  load,
  loadSuccess,
  loadFail
};

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAY]: (state, {payload}) => ({
    ...state,
    isPlaying: true
  }),
  [PAUSE]: (state, {payload}) => ({
    ...state,
    isPlaying: false
  }),
  [END]: (state, {payload}) => ({
    ...state,
    isPlaying: false
  }),
  [LOAD]: (state, {payload}) => ({
    ...state,
    isLoading: true,
    audioUrl: payload.audioUrl,
    cdgUrl: payload.cdgUrl
  }),
  [LOAD_SUCCESS]: (state, {payload}) => ({
    ...state,
    isLoading: false
  }),
  [LOAD_FAIL]: (state, {payload}) => ({
    ...state,
    isLoading: false,
    errorMsg: payload.message
  })
};

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isLoading: false,
  isPlaying: false
};

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type];

  return handler ? handler(state, action) : state;
}
