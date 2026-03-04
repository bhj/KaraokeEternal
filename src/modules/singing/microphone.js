/**
 * Microphone Module – Web Audio API microphone capture.
 *
 * Manages a single shared AudioContext and microphone stream so that multiple
 * callers do not open redundant streams.  The microphone signal is routed
 * through an AnalyserNode only; it is intentionally NOT connected to
 * AudioContext.destination, preventing feedback through the speakers.
 *
 * API
 * ---
 *   await startMicrophone()  – request mic access and start the audio graph
 *   stopMicrophone()         – release all audio resources
 *   getAnalyserNode()        – return the active AnalyserNode (or null)
 *   getAudioContext()        – return the active AudioContext (or null)
 *   isMicrophoneActive()     – true while the mic stream is running
 *
 * Usage
 * -----
 *   import { startMicrophone, stopMicrophone, getAnalyserNode } from './microphone.js'
 *
 *   try {
 *     await startMicrophone()
 *     const analyser = getAnalyserNode()
 *     // … read from analyser …
 *   } catch (err) {
 *     console.error('Mic error:', err.message)
 *   } finally {
 *     stopMicrophone()
 *   }
 */

// ---------------------------------------------------------------------------
// Internal state (module-level singleton)
// ---------------------------------------------------------------------------

/** @type {AudioContext|null} */
let _audioContext = null

/** @type {AnalyserNode|null} */
let _analyserNode = null

/** @type {MediaStreamAudioSourceNode|null} */
let _sourceNode = null

/** @type {MediaStream|null} */
let _micStream = null

/**
 * FFT size used by the AnalyserNode.  A larger value gives higher frequency
 * resolution but increases the per-frame buffer size that callers must read.
 * 4096 → 2048-sample time-domain buffer at 44100 Hz ≈ 46 ms of audio.
 */
const FFT_SIZE = 4096

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Request microphone access and initialise the Web Audio API graph.
 *
 * @returns {Promise<void>} Resolves once the audio graph is ready.
 * @throws  {Error} If the user denies permission or no microphone is available.
 */
export async function startMicrophone () {
  if (_micStream) return // already running – no-op

  // Request mic access with noise/echo processing enabled for cleaner pitch detection
  _micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  })

  _audioContext = new AudioContext()
  _analyserNode = _audioContext.createAnalyser()
  _analyserNode.fftSize = FFT_SIZE
  // Disable smoothing so each frame reflects the raw signal
  _analyserNode.smoothingTimeConstant = 0

  _sourceNode = _audioContext.createMediaStreamSource(_micStream)
  // mic → analyser (NOT → destination, to prevent feedback)
  _sourceNode.connect(_analyserNode)
}

/**
 * Stop the microphone stream and release all Web Audio API resources.
 * Safe to call even when the microphone is not active.
 */
export function stopMicrophone () {
  if (_sourceNode) {
    _sourceNode.disconnect()
    _sourceNode = null
  }

  if (_micStream) {
    _micStream.getTracks().forEach(track => track.stop())
    _micStream = null
  }

  if (_analyserNode) {
    _analyserNode.disconnect()
    _analyserNode = null
  }

  if (_audioContext) {
    _audioContext.close()
    _audioContext = null
  }
}

/**
 * Return the active {@link AnalyserNode}, or `null` when the microphone is
 * not running.  Callers use this node to read PCM time-domain data:
 *
 *   const analyser = getAnalyserNode()
 *   const buf = new Float32Array(analyser.fftSize / 2)
 *   analyser.getFloatTimeDomainData(buf)
 *
 * @returns {AnalyserNode|null}
 */
export function getAnalyserNode () {
  return _analyserNode
}

/**
 * Return the active {@link AudioContext}, or `null` when the microphone is
 * not running.
 *
 * @returns {AudioContext|null}
 */
export function getAudioContext () {
  return _audioContext
}

/**
 * Return `true` while the microphone stream is active.
 *
 * @returns {boolean}
 */
export function isMicrophoneActive () {
  return _micStream !== null
}
