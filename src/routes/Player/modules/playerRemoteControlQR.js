import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
} from 'shared/actionTypes'


// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_LOAD]: (state, { payload }) => ({
    ...state
  }),
  [PLAYER_CMD_OPTIONS]: (state, { payload }) => {
    const { remoteControlQR } = payload
    if (typeof remoteControlQR !== 'object') return state
    
    return {
      ...state,
      ...remoteControlQR
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isEnabled: true,
  alternate: true,
  size: 0.08,
  opacity: 0.8,
  offset: 16,
}

export default function playerRemoteControlQR (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}