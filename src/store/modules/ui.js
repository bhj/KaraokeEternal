import HttpApi from 'lib/HttpApi'
import { CALCULATE_RESPONSIVE_STATE } from 'redux-responsive'
import {
  HEADER_HEIGHT_CHANGE,
  FOOTER_HEIGHT_CHANGE,
  SHOW_ERROR_MESSAGE,
  CLEAR_ERROR_MESSAGE,
  SONG_INFO_REQUEST,
  SONG_INFO_CLOSE,
  _SUCCESS,
  _ERROR,
} from 'shared/actionTypes'

const api = new HttpApi('library')
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
// Song info/edit
// ------------------------------------
export function showSongInfo (songId) {
  return (dispatch, getState) => {
    dispatch(requestSongInfo(songId))

    return api('GET', `/song/${songId}`)
      .then(res => {
        dispatch(receiveSongInfo(res))
      }).catch(err => {
        dispatch(songInfoError(err))
      })
  }
}

function requestSongInfo (songId) {
  return {
    type: SONG_INFO_REQUEST,
    payload: { songId }
  }
}

function receiveSongInfo (res) {
  return {
    type: SONG_INFO_REQUEST + _SUCCESS,
    payload: res
  }
}

function songInfoError (err) {
  return {
    type: SONG_INFO_REQUEST + _ERROR,
    error: err.message,
  }
}

export function closeSongInfo () {
  return {
    type: SONG_INFO_CLOSE,
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
  [SONG_INFO_REQUEST]: (state, { payload }) => ({
    ...state,
    songInfoId: payload.songId,
    songInfoMedia: { result: [], entities: {} },
  }),
  [SONG_INFO_REQUEST + _SUCCESS]: (state, { payload }) => ({
    ...state,
    songInfoMedia: payload,
  }),
  [SONG_INFO_REQUEST + _ERROR]: (state, { payload }) => ({
    ...state,
    songInfoId: null,
  }),
  [SONG_INFO_CLOSE]: (state, { payload }) => ({
    ...state,
    songInfoId: null,
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
  songInfoId: null,
  songInfoMedia: { result: [], entities: {} },
}

export default function uiReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]
  const newState = handler ? handler(state, action) : state

  if (action.error) {
    return {
      ...newState,
      errorMessage: action.error,
    }
  }

  return newState
}
