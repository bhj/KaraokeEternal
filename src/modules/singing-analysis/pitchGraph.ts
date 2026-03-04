/**
 * Pitch Graph – real-time canvas-based pitch visualisation.
 *
 * Draws two overlaid lines on an HTML `<canvas>` element:
 *
 *   • **Expected pitch line** – dashed blue line showing the target note from
 *     song metadata.  Drawn at the frequency supplied per sample.
 *
 *   • **User pitch line** – solid line showing the singer's detected pitch.
 *     Coloured green when close to the expected note, red when off-pitch,
 *     and neutral blue-white when no expected note is available for that frame.
 *
 * Both lines use a logarithmic Y-axis so that musical intervals (semitones)
 * appear evenly spaced, matching human pitch perception.
 *
 * API
 * ---
 *   new PitchGraph(canvas, options?)
 *   graph.addSample(userFreq, expectedFreq?)  – append one data point and redraw
 *   graph.clear()                              – erase history and blank the canvas
 *   graph.resize(width, height)               – update canvas size and redraw
 *
 * Usage
 * -----
 *   import { PitchGraph } from './pitchGraph'
 *
 *   const canvas = document.getElementById('pitchCanvas') as HTMLCanvasElement
 *   const graph  = new PitchGraph(canvas, { maxSamples: 120 })
 *
 *   // In your analysis loop:
 *   graph.addSample(detectedFrequency, expectedFrequency)
 *
 *   // On song end:
 *   graph.clear()
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Frequency at the bottom of the graph (≈ E2). */
const DEFAULT_MIN_HZ = 80

/** Frequency at the top of the graph (≈ F6). */
const DEFAULT_MAX_HZ = 1400

/** Maximum number of samples retained before the oldest are dropped. */
const DEFAULT_MAX_SAMPLES = 120

// ---------------------------------------------------------------------------
// Colour constants
// ---------------------------------------------------------------------------

const COLOUR_EXPECTED = 'rgba(80, 160, 255, 0.85)' // dashed blue – expected note
const COLOUR_IN_TUNE = '#44ee44' // green  – close to target
const COLOUR_OFF_PITCH = '#ff6644' // red    – away from target
const COLOUR_NO_TARGET = 'rgba(180, 220, 255, 0.75)' // neutral – no expected note

/**
 * Frequency ratio tolerance that decides the "in-tune" colour.
 * ~6 % ≈ one semitone in either direction.
 */
const IN_TUNE_RATIO_THRESHOLD = 0.06

// ---------------------------------------------------------------------------
// Helper: logarithmic frequency → Y coordinate
// ---------------------------------------------------------------------------

/**
 * Map a frequency in Hz to a canvas Y coordinate using a logarithmic scale.
 *
 * @param freq         - Frequency in Hz.
 * @param canvasHeight - Total height of the canvas in pixels.
 * @param minHz        - Frequency that maps to the bottom of the canvas.
 * @param maxHz        - Frequency that maps to the top of the canvas.
 * @returns Y coordinate in pixels (0 = top, canvasHeight = bottom).
 */
function freqToY (
  freq: number,
  canvasHeight: number,
  minHz: number,
  maxHz: number,
): number {
  const ratio = Math.log2(freq / minHz) / Math.log2(maxHz / minHz)
  return canvasHeight * (1 - Math.max(0, Math.min(1, ratio)))
}

// ---------------------------------------------------------------------------
// PitchGraph options
// ---------------------------------------------------------------------------

export interface PitchGraphOptions {
  /** Maximum number of samples in the rolling history window (default 120). */
  maxSamples?: number
  /** Lowest frequency shown on the Y-axis in Hz (default 80). */
  minHz?: number
  /** Highest frequency shown on the Y-axis in Hz (default 1400). */
  maxHz?: number
}

// ---------------------------------------------------------------------------
// PitchGraph class
// ---------------------------------------------------------------------------

export class PitchGraph {
  private readonly canvas: HTMLCanvasElement
  private readonly maxSamples: number
  private readonly minHz: number
  private readonly maxHz: number

  private userHistory: Array<number | null> = []
  private expectedHistory: Array<number | null> = []

  /**
   * @param canvas  - The `<canvas>` element to draw on.
   * @param options - Optional configuration (see {@link PitchGraphOptions}).
   */
  constructor (canvas: HTMLCanvasElement, options: PitchGraphOptions = {}) {
    this.canvas = canvas
    this.maxSamples = options.maxSamples ?? DEFAULT_MAX_SAMPLES
    this.minHz = options.minHz ?? DEFAULT_MIN_HZ
    this.maxHz = options.maxHz ?? DEFAULT_MAX_HZ
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Append one sample to the rolling history and redraw the canvas.
   *
   * @param userFreq     - Detected frequency in Hz, or `null` (silence).
   * @param expectedFreq - Expected frequency in Hz, or `null`/`undefined`.
   */
  addSample (userFreq: number | null, expectedFreq: number | null = null): void {
    this.userHistory.push(userFreq ?? null)
    this.expectedHistory.push(expectedFreq ?? null)

    if (this.userHistory.length > this.maxSamples) {
      this.userHistory.shift()
      this.expectedHistory.shift()
    }

    this.draw()
  }

  /** Erase all sample history and blank the canvas. */
  clear (): void {
    this.userHistory = []
    this.expectedHistory = []
    const ctx = this.canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Resize the canvas element and redraw the current history.
   *
   * @param width  - New canvas width in pixels.
   * @param height - New canvas height in pixels.
   */
  resize (width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.draw()
  }

  // ── Private drawing ────────────────────────────────────────────────────────

  private draw (): void {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = this.canvas
    ctx.clearRect(0, 0, width, height)

    const len = this.userHistory.length
    if (len < 2) return

    const xStep = width / (len - 1)

    // ── Draw expected-pitch line (dashed blue) ──────────────────────────────
    ctx.save()
    ctx.strokeStyle = COLOUR_EXPECTED
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    let pathOpen = false

    for (let i = 0; i < len; i++) {
      const freq = this.expectedHistory[i]
      if (freq == null) {
        if (pathOpen) {
          ctx.stroke()
          ctx.beginPath()
          pathOpen = false
        }
        continue
      }
      const x = i * xStep
      const y = freqToY(freq, height, this.minHz, this.maxHz)
      if (!pathOpen) {
        ctx.moveTo(x, y)
        pathOpen = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    if (pathOpen) ctx.stroke()
    ctx.restore()

    // ── Draw user-pitch line (solid, colour reflects accuracy) ─────────────
    ctx.save()
    ctx.lineWidth = 2
    ctx.setLineDash([])
    pathOpen = false

    for (let i = 0; i < len; i++) {
      const userFreq = this.userHistory[i]
      const expectedFreq = this.expectedHistory[i]

      if (userFreq == null) {
        if (pathOpen) {
          ctx.stroke()
          ctx.beginPath()
          pathOpen = false
        }
        continue
      }

      const x = i * xStep
      const y = freqToY(userFreq, height, this.minHz, this.maxHz)

      ctx.strokeStyle = pickColour(userFreq, expectedFreq)

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
 * @param userFreq     - User's detected frequency.
 * @param expectedFreq - Expected frequency (null when unavailable).
 * @returns CSS colour string.
 */
function pickColour (userFreq: number, expectedFreq: number | null): string {
  if (expectedFreq == null) return COLOUR_NO_TARGET
  const ratio = Math.abs(userFreq - expectedFreq) / expectedFreq
  return ratio <= IN_TUNE_RATIO_THRESHOLD ? COLOUR_IN_TUNE : COLOUR_OFF_PITCH
}
