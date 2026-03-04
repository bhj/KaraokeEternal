/**
 * Pitch Graph Module – real-time canvas-based pitch visualisation.
 *
 * Draws two overlaid lines on an HTML <canvas> element:
 *
 *   • Expected pitch line  – dashed blue line showing the target note from
 *     song metadata.  Drawn at the frequency supplied per sample.
 *
 *   • User pitch line      – solid line showing the singer's detected pitch.
 *     Coloured green when close to the expected note, red when off-pitch.
 *     When no expected frequency is available the line uses the neutral
 *     blue-white colour.
 *
 * Both lines use a logarithmic Y-axis so that musical intervals (semitones)
 * are evenly spaced visually, matching the perception of human hearing.
 *
 * API
 * ---
 *   new PitchGraph(canvas, options?)
 *     canvas   – HTMLCanvasElement to draw on.
 *     options  – { maxSamples?, minHz?, maxHz? }
 *
 *   graph.addSample(userFreq, expectedFreq?)
 *     Append one data point and redraw.  Either argument may be null/undefined
 *     to represent a silent frame or an interval without expected note data.
 *
 *   graph.clear()
 *     Erase history and blank the canvas.
 *
 *   graph.resize(width, height)
 *     Update canvas dimensions and redraw.
 *
 * Usage
 * -----
 *   import { PitchGraph } from './pitchGraph.js'
 *
 *   const canvas = document.getElementById('pitchCanvas')
 *   const graph  = new PitchGraph(canvas, { maxSamples: 120 })
 *
 *   // In your analysis loop:
 *   graph.addSample(detectedPitch, expectedPitch)
 *
 *   // On song end:
 *   graph.clear()
 */

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

/** Frequency at the bottom of the graph (E2). */
const DEFAULT_MIN_HZ = 80

/** Frequency at the top of the graph (F6). */
const DEFAULT_MAX_HZ = 1400

/** Maximum number of samples retained before the oldest are dropped. */
const DEFAULT_MAX_SAMPLES = 120

// ---------------------------------------------------------------------------
// Colour constants
// ---------------------------------------------------------------------------

const COLOUR_EXPECTED = 'rgba(80, 160, 255, 0.85)'   // dashed blue
const COLOUR_IN_TUNE  = '#44ee44'                     // green – close to target
const COLOUR_OFF_PITCH = '#ff6644'                    // red   – away from target
const COLOUR_NO_TARGET = 'rgba(180, 220, 255, 0.75)'  // neutral – no expected note

/**
 * Frequency ratio tolerance for the "in-tune" colour.
 * ~6 % ≈ one semitone in either direction.
 */
const IN_TUNE_RATIO_THRESHOLD = 0.06

// ---------------------------------------------------------------------------
// Helper: logarithmic frequency-to-Y mapping
// ---------------------------------------------------------------------------

/**
 * Map a frequency in Hz to a canvas Y coordinate using a logarithmic scale.
 *
 * @param {number} freq         - Frequency in Hz.
 * @param {number} canvasHeight - Total height of the canvas in pixels.
 * @param {number} minHz        - Frequency that maps to the bottom of the canvas.
 * @param {number} maxHz        - Frequency that maps to the top of the canvas.
 * @returns {number} Y coordinate in pixels (0 = top, canvasHeight = bottom).
 */
function freqToY (freq, canvasHeight, minHz, maxHz) {
  const ratio = Math.log2(freq / minHz) / Math.log2(maxHz / minHz)
  return canvasHeight * (1 - Math.max(0, Math.min(1, ratio)))
}

// ---------------------------------------------------------------------------
// PitchGraph class
// ---------------------------------------------------------------------------

export class PitchGraph {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object}  [options]
   * @param {number}  [options.maxSamples=120] - Rolling window size.
   * @param {number}  [options.minHz=80]       - Lowest frequency shown.
   * @param {number}  [options.maxHz=1400]     - Highest frequency shown.
   */
  constructor (canvas, options = {}) {
    this.canvas     = canvas
    this.maxSamples = options.maxSamples ?? DEFAULT_MAX_SAMPLES
    this.minHz      = options.minHz      ?? DEFAULT_MIN_HZ
    this.maxHz      = options.maxHz      ?? DEFAULT_MAX_HZ

    /** @type {Array<number|null>} */
    this._userHistory     = []
    /** @type {Array<number|null>} */
    this._expectedHistory = []
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Append one sample to the rolling history and redraw the canvas.
   *
   * @param {number|null} userFreq     - Detected frequency in Hz, or null (silence).
   * @param {number|null} [expectedFreq] - Expected frequency in Hz, or null/undefined.
   */
  addSample (userFreq, expectedFreq = null) {
    this._userHistory.push(userFreq ?? null)
    this._expectedHistory.push(expectedFreq ?? null)

    if (this._userHistory.length > this.maxSamples) {
      this._userHistory.shift()
      this._expectedHistory.shift()
    }

    this._draw()
  }

  /** Erase all history and blank the canvas. */
  clear () {
    this._userHistory     = []
    this._expectedHistory = []
    const ctx = this.canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Resize the canvas element and redraw.
   *
   * @param {number} width  - New canvas width in pixels.
   * @param {number} height - New canvas height in pixels.
   */
  resize (width, height) {
    this.canvas.width  = width
    this.canvas.height = height
    this._draw()
  }

  // ── Private drawing ────────────────────────────────────────────────────────

  _draw () {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = this.canvas
    ctx.clearRect(0, 0, width, height)

    const len = this._userHistory.length
    if (len < 2) return

    const xStep = width / (len - 1)

    // ── Draw expected-pitch line (dashed blue) ──────────────────────────────
    ctx.save()
    ctx.strokeStyle  = COLOUR_EXPECTED
    ctx.lineWidth    = 1.5
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    let pathOpen = false

    for (let i = 0; i < len; i++) {
      const freq = this._expectedHistory[i]
      if (freq == null) {
        if (pathOpen) { ctx.stroke(); ctx.beginPath(); pathOpen = false }
        continue
      }
      const x = i * xStep
      const y = freqToY(freq, height, this.minHz, this.maxHz)
      if (!pathOpen) { ctx.moveTo(x, y); pathOpen = true }
      else { ctx.lineTo(x, y) }
    }
    if (pathOpen) ctx.stroke()
    ctx.restore()

    // ── Draw user-pitch line (solid, colour = accuracy) ─────────────────────
    ctx.save()
    ctx.lineWidth = 2
    ctx.setLineDash([])
    pathOpen = false

    for (let i = 0; i < len; i++) {
      const userFreq     = this._userHistory[i]
      const expectedFreq = this._expectedHistory[i]

      if (userFreq == null) {
        if (pathOpen) { ctx.stroke(); ctx.beginPath(); pathOpen = false }
        continue
      }

      const x = i * xStep
      const y = freqToY(userFreq, height, this.minHz, this.maxHz)

      // Pick colour based on pitch accuracy for this sample
      const colour = _pickColour(userFreq, expectedFreq)
      ctx.strokeStyle = colour

      if (!pathOpen) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        pathOpen = true
      } else {
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
      }
    }
    if (pathOpen) ctx.stroke()
    ctx.restore()
  }
}

// ---------------------------------------------------------------------------
// Internal colour helper
// ---------------------------------------------------------------------------

/**
 * Choose the stroke colour for a single user-pitch sample.
 *
 * @param {number}      userFreq     - User's detected frequency.
 * @param {number|null} expectedFreq - Expected frequency (null if unavailable).
 * @returns {string} CSS colour string.
 */
function _pickColour (userFreq, expectedFreq) {
  if (expectedFreq == null) return COLOUR_NO_TARGET
  const ratio = Math.abs(userFreq - expectedFreq) / expectedFreq
  return ratio <= IN_TUNE_RATIO_THRESHOLD ? COLOUR_IN_TUNE : COLOUR_OFF_PITCH
}
