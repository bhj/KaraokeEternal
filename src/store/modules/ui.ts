import { AnyAction, createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  CLEAR_ERROR_MESSAGE,
  FOOTER_HEIGHT_CHANGE,
  HEADER_HEIGHT_CHANGE,
  SHOW_ERROR_MESSAGE,
  UI_WINDOW_RESIZE,
} from 'shared/actionTypes'
import { RootState } from 'store/store'

const MAX_CONTENT_WIDTH = 768
let scrollLockTimer: ReturnType<typeof setTimeout> | null

// ------------------------------------
// State & Slice
// ------------------------------------
export interface UIState {
  isErrored: boolean
  errorMessage: string | null
  footerHeight: number
  headerHeight: number
  innerWidth: number
  innerHeight: number
  contentWidth: number
}

const initialState: UIState = {
  isErrored: false,
  errorMessage: null,
  footerHeight: 0,
  headerHeight: 0,
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  contentWidth: Math.min(window.innerWidth, MAX_CONTENT_WIDTH),
}

// Internal action creators for extraReducers (defined before slice)
const headerHeightChangeInternal = createAction<number>(HEADER_HEIGHT_CHANGE)
const footerHeightChangeInternal = createAction<number>(FOOTER_HEIGHT_CHANGE)
const showErrorInternal = createAction<string>(SHOW_ERROR_MESSAGE)
const clearErrorInternal = createAction(CLEAR_ERROR_MESSAGE)
const windowResizeInternal = createAction<{ innerWidth: number, innerHeight: number }>(UI_WINDOW_RESIZE)

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(headerHeightChangeInternal, (state, action) => {
        state.headerHeight = action.payload
      })
      .addCase(footerHeightChangeInternal, (state, action) => {
        state.footerHeight = action.payload
      })
      .addCase(showErrorInternal, (state, action) => {
        state.isErrored = true
        state.errorMessage = action.payload
      })
      .addCase(clearErrorInternal, (state) => {
        state.isErrored = false
      })
      .addCase(windowResizeInternal, (state, action) => {
        state.innerWidth = action.payload.innerWidth
        state.innerHeight = action.payload.innerHeight
        state.contentWidth = Math.min(action.payload.innerWidth, MAX_CONTENT_WIDTH)
      })
      .addMatcher(
        (action): action is AnyAction => !!action.error,
        (state, { error }) => {
          state.isErrored = true
          state.errorMessage = error.message ?? error
        },
      )
  },
})

// Actions with specific action types
export const clearErrorMessage = createAction(CLEAR_ERROR_MESSAGE)
export const showErrorMessage = createAction<string>(SHOW_ERROR_MESSAGE)

export const windowResize = createAction(UI_WINDOW_RESIZE, (window: { innerWidth: number, innerHeight: number }) => ({
  payload: window,
  meta: {
    throttle: {
      wait: 200,
      leading: false,
    },
  },
}))

// ------------------------------------
// Async Thunks
// ------------------------------------
export const setHeaderHeight = createAsyncThunk<void, number, { state: RootState }>(
  'ui/SET_HEADER_HEIGHT',
  async (height: number, { dispatch, getState }) => {
    if (getState().ui.headerHeight === height) return
    dispatch({
      type: HEADER_HEIGHT_CHANGE,
      payload: height ?? 0,
    })
  },
)

export const setFooterHeight = createAsyncThunk<void, number, { state: RootState }>(
  'ui/SET_FOOTER_HEIGHT',
  async (height: number, { dispatch, getState }) => {
    if (getState().ui.footerHeight === height) return
    dispatch({
      type: FOOTER_HEIGHT_CHANGE,
      payload: height ?? 0,
    })
  },
)

// ------------------------------------
// DOM Side Effect (non-Redux)
// ------------------------------------
export const lockScrolling = (lock: boolean) => {
  if (lock) {
    clearTimeout(scrollLockTimer!)
    scrollLockTimer = null
    document.body.classList.add('scroll-lock')
  } else if (!scrollLockTimer) {
    scrollLockTimer = setTimeout(() => {
      scrollLockTimer = null
      document.body.classList.remove('scroll-lock')
    }, 200)
  }
}

export default uiSlice.reducer
