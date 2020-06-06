import HttpApi from 'lib/HttpApi'
import {
  SONG_INFO_REQUEST,
  SONG_INFO_SET_PREFERRED,
  SONG_INFO_CLOSE,
  _SUCCESS,
  _ERROR,
} from 'shared/actionTypes'

const api = new HttpApi()

// ------------------------------------
// Actions
// ------------------------------------
export function showSongInfo (songId) {
  return (dispatch, getState) => {
    dispatch(requestSongInfo(songId))

    return api('GET', `song/${songId}`)
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

export function setPreferred (songId, mediaId, isPreferred) {
  return (dispatch, getState) => {
    dispatch({
      type: SONG_INFO_SET_PREFERRED,
      payload: { songId, mediaId, isPreferred }
    })

    return api(isPreferred ? 'PUT' : 'DELETE', `media/${mediaId}/prefer`)
      .then(res => {
        dispatch({
          type: SONG_INFO_SET_PREFERRED + _SUCCESS,
          payload: { songId, mediaId, isPreferred }
        })

        // re-fetch to update UI
        dispatch(showSongInfo(songId))
      }).catch(err => {
        dispatch({
          type: SONG_INFO_SET_PREFERRED + _ERROR,
          payload: { songId, mediaId, isPreferred },
          error: err.message,
        })
      })
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SONG_INFO_REQUEST]: (state, { payload }) => ({
    ...initialState,
    isLoading: true,
    isVisible: true,
    songId: payload.songId,
  }),
  [SONG_INFO_REQUEST + _SUCCESS]: (state, { payload }) => ({
    ...state,
    isLoading: false,
    media: payload,
  }),
  [SONG_INFO_REQUEST + _ERROR]: (state, { payload }) => ({
    ...state,
    isLoading: false,
    isVisible: false,
  }),
  [SONG_INFO_CLOSE]: (state, { payload }) => ({
    ...state,
    isVisible: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isLoading: false,
  isVisible: false,
  songId: null,
  media: { result: [], entities: {} },
}

export default function songInfoReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
