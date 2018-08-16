import { CALCULATE_RESPONSIVE_STATE } from 'redux-responsive'
import {
  HEADER_HEIGHT_CHANGE,
  FOOTER_HEIGHT_CHANGE,
  SHOW_ERROR_MESSAGE,
  CLEAR_ERROR_MESSAGE,
} from 'constants/actions'

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
    error,
  }
}

export function headerHeightChange ({ height }) {
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
  [CALCULATE_RESPONSIVE_STATE]: (state, { innerWidth, innerHeight }) => ({
    ...state,
    browserWidth: innerWidth,
    browserHeight: innerHeight,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight - state.headerHeight - state.footerHeight,
  }),
  [HEADER_HEIGHT_CHANGE]: (state, { payload }) => ({
    ...state,
    headerHeight: payload,
    viewportHeight: state.browserHeight - payload - state.footerHeight,
  }),
  [FOOTER_HEIGHT_CHANGE]: (state, { payload }) => ({
    ...state,
    footerHeight: payload,
    viewportHeight: state.browserHeight - payload - state.headerHeight,
  }),
  [SHOW_ERROR_MESSAGE]: (state, action) => ({
    ...state,
    errorMessage: action.error,
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
  browserWidth: 0,
  browserHeight: 0,
  headerHeight: 0,
  footerHeight: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  errorMessage: null,
}

export default function uiReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]
  const newState = handler ? handler(state, action) : state

  if (action.error) {
    newState.errorMessage = action.error
  }

  return newState
}
