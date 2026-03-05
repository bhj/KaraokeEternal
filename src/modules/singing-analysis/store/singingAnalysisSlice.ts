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
 *   dispatch(setScore(breakdown))        // update combined score (pitch + timing)
 *   dispatch(setMicrophoneError(true))   // permission denied / device error
 *   dispatch(resetScore())               // clear history & score
 */

import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REDUX_SLICE_INJECT_NOOP } from 'shared/actionTypes'
import type { PitchSample, SingingAnalysisState } from '../types'
import type { ScoreBreakdown } from '../scoringSystem'
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
  timingAccuracy: 0,
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
        state.timingAccuracy = 0
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

    /** Append a new pitch sample and recalculate the pitch-based score. */
    addPitchSample (state, { payload }: PayloadAction<PitchSample>) {
      state.currentPitch = payload.frequency
      state.currentNote = payload.noteName
      state.currentCents = payload.cents

      // Rolling window – drop oldest sample when at capacity
      const history = state.pitchHistory.length >= MAX_PITCH_HISTORY
        ? [...state.pitchHistory.slice(1), payload]
        : [...state.pitchHistory, payload]

      state.pitchHistory = history
      // Score here reflects pitch only; dispatch setScore for the combined value.
      state.score = calculateScore(history).score
    },

    /**
     * Update the overall score from a full {@link ScoreBreakdown} returned by
     * `SingingAnalysis.getScore()`.  When timing data is available this
     * replaces the pitch-only score in `addPitchSample` with the blended
     * (pitch × 70% + timing × 30%) value.
     */
    setScore (state, { payload }: PayloadAction<ScoreBreakdown>) {
      state.score = payload.score
      state.timingAccuracy = Math.round((payload.timingAccuracy ?? 0) * 100)
    },

    /** Reset the score, timing accuracy, and pitch history (e.g. on song change). */
    resetScore (state) {
      state.score = 0
      state.timingAccuracy = 0
      state.pitchHistory = []
    },
  },
})

export const {
  setEnabled,
  setAnalyzing,
  setMicrophoneError,
  addPitchSample,
  setScore,
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
