import butterchurnPresets from 'butterchurn-presets'
import {
  PLAYER_MEDIA_ELEMENT_CHANGE,
  PLAYER_NEXT,
  PLAYER_VISUALIZER,
  PLAYER_VISUALIZER_PRESET,
} from 'shared/actionTypes'

const presetKeys = Object.keys(butterchurnPresets.getPresets())

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_MEDIA_ELEMENT_CHANGE]: (state, { payload }) => ({
    ...state,
    isSupported: payload.isAlphaSupported,
  }),
  [PLAYER_NEXT]: (state, { payload }) => ({
    ...state,
    ...getRandomPreset(),
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
        ...getRandomPreset(),
      }
    }

    const curIdx = presetKeys.indexOf(state.presetKey)
    const nextIdx = curIdx === presetKeys.length - 1 ? 0 : curIdx + 1 // wrap around
    const prevIdx = curIdx === 0 ? presetKeys.length - 1 : curIdx - 1 // wrap around

    return {
      ...state,
      ...getPresetKeyAndName(mode === 'prev' ? prevIdx : nextIdx),
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isEnabled: true,
  isSupported: false,
  ...getRandomPreset(),
  sensitivity: 1,
}

export default function playerVisualizer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}

function getPresetKeyAndName (i) {
  return {
    presetKey: presetKeys[i],
    presetName: `[${i + 1}/${presetKeys.length}] ` + presetKeys[i],
  }
}

function getRandomPreset () {
  return getPresetKeyAndName(Math.floor(Math.random() * (presetKeys.length - 1)))
}
