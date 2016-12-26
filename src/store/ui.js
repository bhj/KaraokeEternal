// ------------------------------------
// Constants
// ------------------------------------
export const SHOW_ERROR_MESSAGE = 'ui/SHOW_ERROR_MESSAGE'
export const CLEAR_ERROR_MESSAGE = 'ui/CLEAR_ERROR_MESSAGE'

// ------------------------------------
// Actions
// ------------------------------------
export function clearErrorMessage() {
  return {
    type: CLEAR_ERROR_MESSAGE,
    payload: null,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SHOW_ERROR_MESSAGE]: (state, {error}) => ({
    ...state,
    errorMessage: error,
  }),
  [CLEAR_ERROR_MESSAGE]: (state, {payload}) => ({
    ...state,
    errorMessage: null,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  errorMessage: null,
}

export default function uiReducer (state = initialState, action) {
  const handler = action.error ?
    ACTION_HANDLERS[SHOW_ERROR_MESSAGE] : ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
