import butterchurnPresets from 'butterchurn-presets'
import {
  PLAYER_MEDIA_CHANGE,
  PLAYER_VISUALIZER,
  PLAYER_VISUALIZER_PRESET,
} from 'shared/actions'

const presetKeys = Object.keys(butterchurnPresets.getPresets())

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_MEDIA_CHANGE]: (state, { payload }) => ({
    ...state,
    isSupported: payload.isAlphaSupported,
    ...randomPresetKeyAndName(),
  }),
  [PLAYER_VISUALIZER]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [PLAYER_VISUALIZER_PRESET]: (state, { payload }) => {
    const { mode } = payload

    if (mode === 'rand') {
      return {
        ...state,
        ...randomPresetKeyAndName(),
      }
    }

    const curIdx = presetKeys.indexOf(state.presetKey)
    const nextIdx = curIdx < presetKeys.length ? curIdx + 1 : 0 // wrap around
    const prevIdx = curIdx > 0 ? curIdx - 1 : presetKeys.length // wrap around

    return {
      ...state,
      presetKey: mode === 'prev' ? presetKeys[prevIdx] : presetKeys[nextIdx],
      presetName: mode === 'prev' ? presetKeys[prevIdx] : presetKeys[nextIdx],
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isEnabled: true,
  isSupported: false,
  presetKey: null,
  presetName: '',
  sensitivity: 1,
}

export default function playerVisualizer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}

function randomPresetKeyAndName () {
  const key = presetKeys[getRandomIntInclusive(0, presetKeys.length - 1)]
  return {
    presetKey: key,
    presetName: key,
  }
}

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
