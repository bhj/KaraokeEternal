import { AnyAction, createAction, createReducer } from '@reduxjs/toolkit'
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
export const clearErrorMessage = createAction(CLEAR_ERROR_MESSAGE)
export const showErrorMessage = createAction<string>(SHOW_ERROR_MESSAGE)

export const setHeaderHeight = (height) => {
  return (dispatch, getState) => {
    if (getState().ui.headerHeight === height) return

    dispatch({
      type: HEADER_HEIGHT_CHANGE,
      payload: height ?? 0, // height might be undefined if Header renders nothing
    })
  }
}

export const setFooterHeight = (height) => {
  return (dispatch, getState) => {
    if (getState().ui.footerHeight === height) return

    dispatch({
      type: FOOTER_HEIGHT_CHANGE,
      payload: height ?? 0, // height might be undefined if Footer renders nothing
    })
  }
}

export const windowResize = createAction(UI_WINDOW_RESIZE, window => ({
  payload: window,
  meta: {
    throttle: {
      wait: 200,
      leading: false,
    },
  },
}))

// does not dispatch anything (only affects the DOM)
export const lockScrolling = (lock) => {
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
const footerHeightChange = createAction<number>(FOOTER_HEIGHT_CHANGE)
const headerHeightChange = createAction<number>(HEADER_HEIGHT_CHANGE)

// ------------------------------------
// Reducer
// ------------------------------------
export interface State {
  isErrored: boolean
  errorMessage: string | null
  footerHeight: number
  headerHeight: number
  innerWidth: number
  innerHeight: number
  contentWidth: number
}

const initialState: State = {
  isErrored: false,
  errorMessage: null,
  footerHeight: 0,
  headerHeight: 0,
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  contentWidth: Math.min(window.innerWidth, MAX_CONTENT_WIDTH),
}

const uiReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(headerHeightChange, (state, { payload }) => {
      state.headerHeight = payload
    })
    .addCase(footerHeightChange, (state, { payload }) => {
      state.footerHeight = payload
    })
    .addCase(showErrorMessage, (state, { payload }) => {
      state.isErrored = true
      state.errorMessage = payload
    })
    .addCase(clearErrorMessage, (state) => {
      state.isErrored = false
    })
    .addCase(windowResize, (state, { payload }) => {
      state.innerWidth = payload.innerWidth
      state.innerHeight = payload.innerHeight
      state.contentWidth = Math.min(payload.innerWidth, MAX_CONTENT_WIDTH)
    })
    .addMatcher(
      (action): action is AnyAction => !!action.error,
      (state, { error }) => {
        state.isErrored = true
        state.errorMessage = error.message ?? error
      },
    )
})

export default uiReducer
