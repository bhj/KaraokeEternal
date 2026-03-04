/**
 * Score UI Module – self-contained floating score panel.
 *
 * Creates a small overlay panel that displays:
 *   • Pitch accuracy  (%)
 *   • Timing accuracy (%)
 *   • Final score     (%)
 *
 * The panel is implemented in vanilla DOM/CSS so it has no dependency on
 * React, Redux, or any other framework.  It can be dropped into any page
 * without touching the existing karaoke player UI.
 *
 * The panel is absolutely positioned (bottom-left corner by default) and
 * uses a high z-index so it floats above all existing content.
 *
 * API
 * ---
 *   new ScoreUI(options?)
 *     options – { container?, position? }
 *       container – HTMLElement to append the panel to (default: document.body)
 *       position  – 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
 *                   (default: 'bottom-left')
 *
 *   ui.mount()    – insert the panel into the DOM (idempotent)
 *   ui.unmount()  – remove the panel from the DOM and release listeners
 *   ui.update(scores)
 *     scores – { pitchAccuracy, timingAccuracy, finalScore }
 *     All values are integers 0–100 as returned by ScoringEngine.getScore().
 *   ui.reset()    – set all displayed values back to "–"
 *
 * Usage
 * -----
 *   import { ScoreUI } from './scoreUI.js'
 *
 *   const ui = new ScoreUI({ position: 'bottom-right' })
 *   ui.mount()
 *
 *   // In your analysis loop:
 *   ui.update(engine.getScore())
 *
 *   // On song end / cleanup:
 *   ui.unmount()
 */

// ---------------------------------------------------------------------------
// CSS injected once per page (avoids duplicates via a sentinel class)
// ---------------------------------------------------------------------------

const STYLE_ID = 'singing-score-ui-styles'

const PANEL_CSS = `
/* ── Singing Score UI – injected styles ─────────────────────────────────── */

.singing-score-ui {
  position: absolute;
  z-index: 9999;
  min-width: 160px;
  padding: 10px 14px 12px;
  background: rgba(0, 0, 0, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  backdrop-filter: blur(6px);
  user-select: none;
  pointer-events: none; /* panel is display-only; does not intercept clicks */
}

.singing-score-ui.bottom-left  { bottom: 3vh; left: 3vh; }
.singing-score-ui.bottom-right { bottom: 3vh; right: 3vh; }
.singing-score-ui.top-left     { top: 3vh; left: 3vh; }
.singing-score-ui.top-right    { top: 3vh; right: 3vh; }

.singing-score-ui__title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 8px;
}

.singing-score-ui__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin: 3px 0;
}

.singing-score-ui__label {
  font-size: 11px;
  color: rgba(255,255,255,0.65);
}

.singing-score-ui__value {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #aef;
}

.singing-score-ui__value.good    { color: #4e4; }
.singing-score-ui__value.average { color: #fd4; }
.singing-score-ui__value.poor    { color: #f64; }

.singing-score-ui__divider {
  height: 1px;
  background: rgba(255,255,255,0.12);
  margin: 6px 0;
}

.singing-score-ui__final .singing-score-ui__value {
  font-size: 22px;
}
`

// ---------------------------------------------------------------------------
// Colour helper
// ---------------------------------------------------------------------------

/**
 * Choose a CSS class name based on the score value.
 *
 * @param {number|null} value - Score 0–100, or null.
 * @returns {string} 'good' | 'average' | 'poor' | ''
 */
function scoreClass (value) {
  if (value == null) return ''
  if (value >= 80) return 'good'
  if (value >= 50) return 'average'
  return 'poor'
}

// ---------------------------------------------------------------------------
// ScoreUI class
// ---------------------------------------------------------------------------

export class ScoreUI {
  /**
   * @param {object}      [options]
   * @param {HTMLElement} [options.container=document.body]
   *   Parent element into which the panel is inserted.
   * @param {'bottom-left'|'bottom-right'|'top-left'|'top-right'} [options.position='bottom-left']
   *   Corner in which the panel appears.
   */
  constructor (options = {}) {
    this._container = options.container ?? null // resolved lazily on mount
    this._position  = options.position  ?? 'bottom-left'

    /** @type {HTMLElement|null} */
    this._panelEl = null

    /** @type {HTMLElement|null} References to value cells for fast updates. */
    this._pitchValueEl   = null
    this._timingValueEl  = null
    this._finalValueEl   = null
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Insert the panel into the DOM.  Idempotent – safe to call multiple times. */
  mount () {
    if (this._panelEl) return // already mounted

    _injectStyles()

    const container = this._container ?? document.body
    this._panelEl   = this._buildPanel()
    container.appendChild(this._panelEl)
  }

  /** Remove the panel from the DOM and release all references. */
  unmount () {
    if (!this._panelEl) return
    this._panelEl.remove()
    this._panelEl        = null
    this._pitchValueEl   = null
    this._timingValueEl  = null
    this._finalValueEl   = null
  }

  /**
   * Update the displayed scores.
   *
   * @param {{ pitchAccuracy: number, timingAccuracy: number, finalScore: number }} scores
   *   Integer values 0–100 as returned by `ScoringEngine.getScore()`.
   */
  update ({ pitchAccuracy, timingAccuracy, finalScore }) {
    if (!this._panelEl) return

    _setValueCell(this._pitchValueEl,  pitchAccuracy,  `${pitchAccuracy}%`)
    _setValueCell(this._timingValueEl, timingAccuracy, `${timingAccuracy}%`)
    _setValueCell(this._finalValueEl,  finalScore,     `${finalScore}`)
  }

  /** Reset all displayed values to "–" (e.g. when a new song starts). */
  reset () {
    if (!this._panelEl) return

    for (const el of [this._pitchValueEl, this._timingValueEl, this._finalValueEl]) {
      if (!el) continue
      el.textContent = '–'
      el.className   = 'singing-score-ui__value'
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Build and return the panel element.  The panel is not yet appended to the
   * DOM here; `mount()` handles that.
   *
   * @returns {HTMLElement}
   */
  _buildPanel () {
    const panel = _el('div', `singing-score-ui ${this._position}`)

    const title = _el('div', 'singing-score-ui__title')
    title.textContent = 'Singing Score'
    panel.appendChild(title)

    // Pitch accuracy row
    const [pitchRow, pitchValue] = _makeRow('Pitch', '–')
    this._pitchValueEl = pitchValue
    panel.appendChild(pitchRow)

    // Timing accuracy row
    const [timingRow, timingValue] = _makeRow('Timing', '–')
    this._timingValueEl = timingValue
    panel.appendChild(timingRow)

    // Divider
    panel.appendChild(_el('div', 'singing-score-ui__divider'))

    // Final score row
    const [finalRow, finalValue] = _makeRow('Score', '–', 'singing-score-ui__final')
    this._finalValueEl = finalValue
    panel.appendChild(finalRow)

    return panel
  }
}

// ---------------------------------------------------------------------------
// DOM utilities
// ---------------------------------------------------------------------------

/**
 * Create a `<div>` with the given class name.
 *
 * @param {string} tag
 * @param {string} [className]
 * @returns {HTMLElement}
 */
function _el (tag, className) {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}

/**
 * Build a label + value row.
 *
 * @param {string} label
 * @param {string} initialValue
 * @param {string} [rowExtraClass]
 * @returns {[HTMLElement, HTMLElement]} [rowElement, valueElement]
 */
function _makeRow (label, initialValue, rowExtraClass = '') {
  const row   = _el('div', `singing-score-ui__row ${rowExtraClass}`.trim())
  const lbl   = _el('div', 'singing-score-ui__label')
  const value = _el('div', 'singing-score-ui__value')

  lbl.textContent   = label
  value.textContent = initialValue

  row.appendChild(lbl)
  row.appendChild(value)

  return [row, value]
}

/**
 * Update a value cell's text and colour class.
 *
 * @param {HTMLElement|null} el
 * @param {number|null}      value
 * @param {string}           text
 */
function _setValueCell (el, value, text) {
  if (!el) return
  el.textContent = text
  el.className   = `singing-score-ui__value ${scoreClass(value)}`.trim()
}

/**
 * Inject the panel stylesheet into `<head>` once per page load.
 */
function _injectStyles () {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id          = STYLE_ID
  style.textContent = PANEL_CSS
  document.head.appendChild(style)
}
