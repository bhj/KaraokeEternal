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
 *   await analysis.startAnalysis({ onPitchSample, onError }, songMetadata)
 *   analysis.stopAnalysis()
 *   const breakdown = analysis.getScore()   // ScoreBreakdown
 *
 * Redux slice
 * -----------
 *   import singingAnalysisReducer, {
 *     setEnabled,
 *     setAnalyzing,
 *     addPitchSample,
 *     setScore,
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
 *   import type { PitchSample, SongNote, SingingAnalysisState } from 'modules/singing-analysis'
 *
 * Pitch graph (standalone canvas class)
 * ----------------------------------------
 *   import { PitchGraph } from 'modules/singing-analysis'
 *   const graph = new PitchGraph(canvasElement, { maxSamples: 120 })
 *   graph.addSample(detectedHz, expectedHz)
 *
 * Timing analyser
 * ---------------
 *   import { evaluateSample, analyzeTimings, findNearestMetadata } from 'modules/singing-analysis'
 */

export { default } from './SingingAnalysis'
export type { PitchSample, SongNote, TimingPair, SingingAnalysisState, SingingAnalysisCallbacks } from './types'
export {
  detectPitch,
  frequencyToNoteName,
  frequencyToMidi,
  midiToFrequency,
  getCentsDeviation,
} from './pitchDetection'
export { calculateScore } from './scoringSystem'
export type { ScoreBreakdown } from './scoringSystem'
export {
  evaluateSample,
  analyzeTimings,
  findNearestMetadata,
  ALLOWED_DEVIATION_MS,
} from './timingAnalyzer'
export { PitchGraph } from './pitchGraph'
export type { PitchGraphOptions } from './pitchGraph'
