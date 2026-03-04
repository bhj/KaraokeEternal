/**
 * Singing Analysis Module – public API.
 *
 * Other parts of the application should import from this file rather than
 * reaching into the internal module files directly.  This keeps the internal
 * implementation details free to change.
 *
 * Core class
 * ----------
 *   import SingingAnalysis from 'modules/singing-analysis'
 *
 *   const analysis = new SingingAnalysis()
 *   await analysis.startAnalysis({ onPitchSample, onError })
 *   analysis.stopAnalysis()
 *   const score = analysis.getScore()
 *
 * Redux slice
 * -----------
 *   import singingAnalysisReducer, {
 *     setEnabled,
 *     setAnalyzing,
 *     addPitchSample,
 *     resetScore,
 *   } from 'modules/singing-analysis/store/singingAnalysisSlice'
 *
 * React panel component
 * ----------------------
 *   import SingingAnalysisPanel from
 *     'modules/singing-analysis/components/SingingAnalysisPanel/SingingAnalysisPanel'
 *
 * Types
 * -----
 *   import type { PitchSample, SingingAnalysisState } from 'modules/singing-analysis/types'
 */

export { default } from './SingingAnalysis'
export type { PitchSample, SingingAnalysisState, SingingAnalysisCallbacks } from './types'
export {
  detectPitch,
  frequencyToNoteName,
  frequencyToMidi,
  midiToFrequency,
  getCentsDeviation,
} from './pitchDetection'
export { calculateScore } from './scoringSystem'
export type { ScoreBreakdown } from './scoringSystem'
