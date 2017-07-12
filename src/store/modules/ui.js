import {
  HEADER_HEIGHT_CHANGE,
  FOOTER_HEIGHT_CHANGE,
  SHOW_ERROR_MESSAGE,
  CLEAR_ERROR_MESSAGE,
} from 'constants'

// ------------------------------------
// Actions
// ------------------------------------
export function clearErrorMessage () {
  return {
    type: CLEAR_ERROR_MESSAGE,
  }
}

export function showErrorMessage (error) {
  return {
    type: SHOW_ERROR_MESSAGE,
    meta: {
      error,
    }
  }
}

export function setHeaderHeight ({ height }) {
  return (dispatch, getState) => {
    if (getState().ui.headerHeight === height) return

    dispatch({
      type: HEADER_HEIGHT_CHANGE,
      payload: height,
    })
  }
}

export function setFooterHeight ({ height }) {
  return (dispatch, getState) => {
    if (getState().ui.footerHeight === height) return

    dispatch({
      type: FOOTER_HEIGHT_CHANGE,
      payload: height,
    })
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [HEADER_HEIGHT_CHANGE]: (state, { payload }) => ({
    ...state,
    headerHeight: payload,
  }),
  [FOOTER_HEIGHT_CHANGE]: (state, { payload }) => ({
    ...state,
    footerHeight: payload,
  }),
  [SHOW_ERROR_MESSAGE]: (state, action) => ({
    ...state,
    errorMessage: action.meta.error,
  }),
  [CLEAR_ERROR_MESSAGE]: (state, { payload }) => ({
    ...state,
    errorMessage: null,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  headerHeight: 0,
  footerHeight: 0,
  errorMessage: null,
}

export default function uiReducer (state = initialState, action) {
  const handler = action.meta && action.meta.error
    ? ACTION_HANDLERS[SHOW_ERROR_MESSAGE] : ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
