/**
 * Redux slice for the Singing Analysis module.
 *
 * State is injected lazily (see SingingAnalysisPanel component) so that the
 * module has **zero impact** on the bundle when the panel is not rendered.
 *
 * Feature flag
 * ------------
 *   dispatch(setEnabled(true))   // show the panel
 *   dispatch(setEnabled(false))  // hide and reset
 *
 * Lifecycle actions
 * -----------------
 *   dispatch(setAnalyzing(true))         // microphone opened
 *   dispatch(addPitchSample(sample))     // new pitch measurement
 *   dispatch(setMicrophoneError(true))   // permission denied / device error
 *   dispatch(resetScore())               // clear history & score
 */

import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REDUX_SLICE_INJECT_NOOP } from 'shared/actionTypes'
import type { PitchSample, SingingAnalysisState } from '../types'
import { calculateScore } from '../scoringSystem'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of pitch samples retained in the Redux store (for the graph). */
const MAX_PITCH_HISTORY = 100

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState: SingingAnalysisState = {
  isEnabled: false,
  isAnalyzing: false,
  isMicrophoneError: false,
  currentPitch: null,
  currentNote: null,
  currentCents: null,
  score: 0,
  pitchHistory: [],
}

const singingAnalysisSlice = createSlice({
  name: 'singingAnalysis',
  initialState,
  reducers: {
    /** Enable or disable the singing analysis panel (feature flag). */
    setEnabled (state, { payload }: PayloadAction<boolean>) {
      state.isEnabled = payload
      if (!payload) {
        // Reset derived state when the panel is hidden so that a fresh
        // session starts cleanly the next time it is enabled.
        state.isAnalyzing = false
        state.isMicrophoneError = false
        state.currentPitch = null
        state.currentNote = null
        state.currentCents = null
        state.score = 0
        state.pitchHistory = []
      }
    },

    /** Mark whether the microphone stream is currently active. */
    setAnalyzing (state, { payload }: PayloadAction<boolean>) {
      state.isAnalyzing = payload
      if (!payload) {
        state.currentPitch = null
        state.currentNote = null
        state.currentCents = null
      }
    },

    /** Record a microphone error (e.g. permission denied). */
    setMicrophoneError (state, { payload }: PayloadAction<boolean>) {
      state.isMicrophoneError = payload
      state.isAnalyzing = false
    },

    /** Append a new pitch sample and recalculate the score. */
    addPitchSample (state, { payload }: PayloadAction<PitchSample>) {
      state.currentPitch = payload.frequency
      state.currentNote = payload.noteName
      state.currentCents = payload.cents

      // Rolling window – drop oldest sample when at capacity
      const history = state.pitchHistory.length >= MAX_PITCH_HISTORY
        ? [...state.pitchHistory.slice(1), payload]
        : [...state.pitchHistory, payload]

      state.pitchHistory = history
      state.score = calculateScore(history).score
    },

    /** Reset the score and pitch history (e.g. on song change). */
    resetScore (state) {
      state.score = 0
      state.pitchHistory = []
    },
  },
})

export const {
  setEnabled,
  setAnalyzing,
  setMicrophoneError,
  addPitchSample,
  resetScore,
} = singingAnalysisSlice.actions

export default singingAnalysisSlice.reducer

/**
 * No-op action used to notify the store that a new lazy-loaded reducer slice
 * has been injected (same pattern used by the player slice).
 */
export const sliceInjectNoOp = createAction(REDUX_SLICE_INJECT_NOOP)

// ---------------------------------------------------------------------------
// TypeScript module augmentation – extend the LazyLoadedSlices interface so
// that `state.singingAnalysis` is typed correctly throughout the app without
// modifying store/reducers.ts.
// ---------------------------------------------------------------------------
declare module 'store/reducers' {
  export interface LazyLoadedSlices {
    singingAnalysis: typeof initialState
  }
}
