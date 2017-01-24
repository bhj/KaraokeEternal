// ------------------------------------
// Constants
// ------------------------------------
export const HEADER_HEIGHT_CHANGE = 'ui/HEADER_HEIGHT_CHANGE'
export const FOOTER_HEIGHT_CHANGE = 'ui/FOOTER_HEIGHT_CHANGE'
export const SHOW_ERROR_MESSAGE = 'ui/SHOW_ERROR_MESSAGE'
export const CLEAR_ERROR_MESSAGE = 'ui/CLEAR_ERROR_MESSAGE'

export const PREFS_CHANGE_REQUEST = 'server/PREFS_CHANGE'
export const PREFS_CHANGE = 'ui/PREFS_CHANGE'

export const PROVIDER_REFRESH_REQUEST = 'server/PROVIDER_REFRESH'

// ------------------------------------
// Actions
// ------------------------------------
export function clearErrorMessage() {
  return {
    type: CLEAR_ERROR_MESSAGE,
    payload: null,
  }
}

export function setHeaderHeight({height}) {
  return (dispatch, getState) => {
    if (getState().ui.headerHeight === height) return

    dispatch({
      type: HEADER_HEIGHT_CHANGE,
      payload: height,
    })
  }
}

export function setFooterHeight({height}) {
  return (dispatch, getState) => {
    if (getState().ui.footerHeight === height) return

    dispatch({
      type: FOOTER_HEIGHT_CHANGE,
      payload: height,
    })
  }
}

export function setPrefs(domain, data) {
  return {
    type: PREFS_CHANGE_REQUEST,
    payload: { domain, data },
  }
}

export function providerRefresh(provider) {
  return {
    type: PROVIDER_REFRESH_REQUEST,
    payload: provider,
  }
}
// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [HEADER_HEIGHT_CHANGE]: (state, {payload}) => ({
    ...state,
    headerHeight: payload,
  }),
  [FOOTER_HEIGHT_CHANGE]: (state, {payload}) => ({
    ...state,
    footerHeight: payload,
  }),
  [SHOW_ERROR_MESSAGE]: (state, {error}) => ({
    ...state,
    errorMessage: error,
  }),
  [CLEAR_ERROR_MESSAGE]: (state, {payload}) => ({
    ...state,
    errorMessage: null,
  }),
  [PREFS_CHANGE]: (state, {payload}) => ({
    ...state,
    prefs: payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  headerHeight: 0,
  footerHeight: 0,
  errorMessage: null,
  prefs: null,
}

export default function uiReducer (state = initialState, action) {
  const handler = action.error ?
    ACTION_HANDLERS[SHOW_ERROR_MESSAGE] : ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
