import presets from 'butterchurn-presets/all'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
} from 'shared/actionTypes'

const _presetKeys = Object.keys(presets)

export function playerVisualizerError (err) {
  return {
    type: PLAYER_VISUALIZER_ERROR,
    payload: { message: err.message },
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_LOAD]: (state, { payload }) => ({
    ...state,
    ...getRandomPreset(),
  }),
  [PLAYER_CMD_OPTIONS]: (state, { payload }) => {
    const { visualizer } = payload
    if (typeof visualizer !== 'object') return state

    let preset = {}

    if (visualizer.nextPreset || visualizer.prevPreset) {
      const curIdx = _presetKeys.indexOf(state.presetKey)
      const nextIdx = curIdx === _presetKeys.length - 1 ? 0 : curIdx + 1 // wrap around
      const prevIdx = curIdx === 0 ? _presetKeys.length - 1 : curIdx - 1 // wrap around

      preset = getPreset(visualizer.nextPreset ? nextIdx : visualizer.prevPreset ? prevIdx : curIdx)
    } else if (visualizer.randomPreset) {
      preset = getRandomPreset()
    }

    return {
      ...state,
      ...preset,
      isEnabled: typeof visualizer.isEnabled === 'boolean' ? visualizer.isEnabled : state.isEnabled,
      sensitivity: typeof visualizer.sensitivity === 'number' ? visualizer.sensitivity : state.sensitivity,
    }
  },
  [PLAYER_VISUALIZER_ERROR]: (state, { payload }) => ({
    ...state,
    isSupported: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isEnabled: true,
  isSupported: true,
  ...getRandomPreset(),
  sensitivity: 1,
}

export default function playerVisualizer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}

function getPreset (i) {
  return {
    presetKey: _presetKeys[i],
    presetName: `[${i + 1}/${_presetKeys.length}] ` + _presetKeys[i],
  }
}

function getRandomPreset () {
  return getPreset(Math.floor(Math.random() * (_presetKeys.length - 1)))
}
