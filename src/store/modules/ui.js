import {
  CLEAR_ERROR_MESSAGE,
  FOOTER_HEIGHT_CHANGE,
  HEADER_HEIGHT_CHANGE,
  SHOW_ERROR_MESSAGE,
  UI_WINDOW_RESIZE,
} from 'shared/actionTypes'

const MAX_CONTENT_WIDTH = 768
let scrollLockTimer

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

export function setHeaderHeight (height) {
  return (dispatch, getState) => {
    if (getState().ui.headerHeight === height) return

    dispatch({
      type: HEADER_HEIGHT_CHANGE,
      payload: height,
    })
  }
}

export function setFooterHeight (height) {
  return (dispatch, getState) => {
    if (getState().ui.footerHeight === height) return

    dispatch({
      type: FOOTER_HEIGHT_CHANGE,
      payload: height,
    })
  }
}

export function windowResize (window) {
  return {
    type: UI_WINDOW_RESIZE,
    payload: window,
    meta: {
      throttle: {
        wait: 200,
        leading: false,
      }
    }
  }
}

// does not dispatch anything (only affects the DOM)
export function lockScrolling (lock) {
  if (lock) {
    clearTimeout(scrollLockTimer)
    scrollLockTimer = null
    document.body.classList.add('scroll-lock')
  } else if (!scrollLockTimer) {
    scrollLockTimer = setTimeout(() => {
      scrollLockTimer = null
      document.body.classList.remove('scroll-lock')
    }, 200)
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
    isErrored: true,
    errorMessage: action.error,
  }),
  [CLEAR_ERROR_MESSAGE]: (state, { payload }) => ({
    ...state,
    isErrored: false,
  }),
  [UI_WINDOW_RESIZE]: (state, { payload }) => ({
    ...state,
    innerWidth: payload.innerWidth,
    innerHeight: payload.innerHeight,
    contentWidth: Math.min(payload.innerWidth, MAX_CONTENT_WIDTH),
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isErrored: false,
  errorMessage: null,
  footerHeight: 0,
  headerHeight: 0,
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  contentWidth: Math.min(window.innerWidth, MAX_CONTENT_WIDTH),
}

export default function uiReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]
  const newState = handler ? handler(state, action) : state

  if (action.error) {
    return {
      ...newState,
      isErrored: true,
      errorMessage: action.error,
    }
  }

  return newState
}
