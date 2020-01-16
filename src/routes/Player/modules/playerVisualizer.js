import butterchurnPresets from 'butterchurn-presets'
import {
  PLAYER_NEXT,
  PLAYER_VISUALIZER,
  PLAYER_VISUALIZER_PRESET,
} from 'shared/actionTypes'

const _presetKeys = Object.keys(butterchurnPresets.getPresets())

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
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

    const curIdx = _presetKeys.indexOf(state.presetKey)
    const nextIdx = curIdx === _presetKeys.length - 1 ? 0 : curIdx + 1 // wrap around
    const prevIdx = curIdx === 0 ? _presetKeys.length - 1 : curIdx - 1 // wrap around

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
  isSupported: getWebGLSupport(),
  ...getRandomPreset(),
  sensitivity: 1,
}

export default function playerVisualizer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}

function getPresetKeyAndName (i) {
  return {
    presetKey: _presetKeys[i],
    presetName: `[${i + 1}/${_presetKeys.length}] ` + _presetKeys[i],
  }
}

function getRandomPreset () {
  return getPresetKeyAndName(Math.floor(Math.random() * (_presetKeys.length - 1)))
}

function getWebGLSupport () {
  try {
    return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl')
  } catch (e) {
    return false
  }
}
