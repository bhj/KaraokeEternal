/**
 * Singing Module – public entry point.
 *
 * Import from this file rather than reaching into the individual sub-modules
 * directly.  This keeps the internal file layout free to change without
 * breaking consumers.
 *
 * Quick-start
 * -----------
 *   import {
 *     startMicrophone, stopMicrophone, getAnalyserNode, getAudioContext,
 *     detectPitch,
 *     PitchGraph,
 *     analyzeTimings, evaluateSample, findNearestMetadata,
 *     ScoringEngine,
 *     ScoreUI,
 *   } from 'modules/singing'
 *
 *   // 1. Open the microphone
 *   await startMicrophone()
 *   const analyser = getAnalyserNode()
 *   const ctx      = getAudioContext()
 *
 *   // 2. Initialise scoring with song metadata
 *   const engine = new ScoringEngine()
 *   engine.startScoring(songMetadata)   // [{ time: 2.3, note: 440 }, …]
 *
 *   // 3. Mount the score panel
 *   const ui = new ScoreUI({ position: 'bottom-right' })
 *   ui.mount()
 *
 *   // 4. Attach a canvas for the pitch graph
 *   const graph = new PitchGraph(document.getElementById('pitchCanvas'))
 *
 *   // 5. Run the analysis loop
 *   const buf = new Float32Array(analyser.fftSize / 2)
 *   setInterval(() => {
 *     analyser.getFloatTimeDomainData(buf)
 *     const result = detectPitch(buf, ctx.sampleRate)
 *     const pitch  = result?.pitch ?? null
 *     const ts     = Date.now()
 *
 *     engine.processVoiceInput(pitch, ts)
 *     graph.addSample(pitch, currentExpectedFrequency)
 *     ui.update(engine.getScore())
 *   }, 100)
 *
 *   // 6. Clean up
 *   engine.stopScoring()
 *   stopMicrophone()
 *   ui.unmount()
 *   console.log('Final score:', engine.getScore())
 *
 * Module descriptions
 * -------------------
 *   microphone.js    – Web Audio API microphone capture (start/stop)
 *   pitchDetector.js – Autocorrelation pitch detection (Float32Array → Hz + note name)
 *   pitchGraph.js    – Canvas-based real-time pitch visualisation
 *   timingAnalyzer.js – Timestamp comparison; timing accuracy in [0,1]
 *   scoringEngine.js – Session-level scoring (pitchAccuracy, timingAccuracy, finalScore)
 *   scoreUI.js       – Floating vanilla-DOM score overlay panel
 */

// ── Microphone ──────────────────────────────────────────────────────────────
export {
  startMicrophone,
  stopMicrophone,
  getAnalyserNode,
  getAudioContext,
  isMicrophoneActive,
} from './microphone.js'

// ── Pitch detection ─────────────────────────────────────────────────────────
export {
  detectPitch,
  frequencyToNoteName,
  midiToFrequency,
} from './pitchDetector.js'

// ── Pitch graph ─────────────────────────────────────────────────────────────
export { PitchGraph } from './pitchGraph.js'

// ── Timing analysis ─────────────────────────────────────────────────────────
export {
  evaluateSample,
  analyzeTimings,
  findNearestMetadata,
  ALLOWED_DEVIATION_MS,
} from './timingAnalyzer.js'

// ── Scoring engine ──────────────────────────────────────────────────────────
export { ScoringEngine } from './scoringEngine.js'

// ── Score UI panel ──────────────────────────────────────────────────────────
export { ScoreUI } from './scoreUI.js'
