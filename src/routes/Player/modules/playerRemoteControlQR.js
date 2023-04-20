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
      isEnabled: typeof remoteControlQR.isEnabled === 'boolean' ? remoteControlQR.isEnabled : state.isEnabled,
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isEnabled: true,
  test: 123,
}

export default function playerRemoteControlQR (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}