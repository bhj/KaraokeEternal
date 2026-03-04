/**
 * SingingAnalysisPanel
 *
 * An optional overlay panel that can be enabled on the Player screen without
 * affecting any existing karaoke playback logic.
 *
 * Features
 * --------
 *   - Toggle button (bottom-right corner) to show/hide the panel
 *   - Microphone start/stop control
 *   - Real-time note name & cents-deviation meter
 *   - Running score (0–100)
 *   - Scrolling pitch history graph (canvas)
 *
 * Integration
 * -----------
 * The component lazily injects its own Redux slice so there is zero bundle
 * overhead when the panel is not in use.  It is rendered after all existing
 * player components and is absolutely positioned, so it does not affect
 * layout.
 */

import React, { useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import SingingAnalysis from '../../SingingAnalysis'
import singingAnalysisReducer, {
  addPitchSample,
  resetScore,
  setAnalyzing,
  setEnabled,
  setMicrophoneError,
  sliceInjectNoOp,
} from '../../store/singingAnalysisSlice'
import type { PitchSample } from '../../types'
import styles from './SingingAnalysisPanel.css'

// ---------------------------------------------------------------------------
// Graph drawing
// ---------------------------------------------------------------------------

/** Frequency range displayed in the pitch graph. */
const GRAPH_MIN_HZ = 80
const GRAPH_MAX_HZ = 1400

/**
 * Map a frequency (Hz) to a canvas Y coordinate.
 * Uses a logarithmic scale so musical intervals appear evenly spaced.
 */
function freqToY (freq: number, canvasHeight: number): number {
  const ratio = Math.log2(freq / GRAPH_MIN_HZ) / Math.log2(GRAPH_MAX_HZ / GRAPH_MIN_HZ)
  return canvasHeight * (1 - Math.max(0, Math.min(1, ratio)))
}

function drawPitchGraph (
  canvas: HTMLCanvasElement,
  pitchHistory: readonly PitchSample[],
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  if (pitchHistory.length < 2) return

  const xStep = width / (pitchHistory.length - 1)

  ctx.beginPath()
  let pathStarted = false

  pitchHistory.forEach((sample, i) => {
    if (sample.frequency == null) {
      if (pathStarted) {
        ctx.stroke()
        ctx.beginPath()
        pathStarted = false
      }
      return
    }

    const x = i * xStep
    const y = freqToY(sample.frequency, height)

    // Colour based on cents deviation
    const absCents = Math.abs(sample.cents ?? 50)
    const inTune = absCents <= 25
    ctx.strokeStyle = inTune ? '#44ee44' : '#ff6644'
    ctx.lineWidth = 2

    if (!pathStarted) {
      ctx.moveTo(x, y)
      pathStarted = true
    } else {
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  })

  if (pathStarted) ctx.stroke()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SingingAnalysisPanel: React.FC = () => {
  const dispatch = useAppDispatch()

  // ── Lazy-inject the Redux slice on first render ───────────────────────────
  if (!useAppSelector(state => state.singingAnalysis)) {
    combinedReducer.inject({
      reducerPath: 'singingAnalysis',
      reducer: singingAnalysisReducer,
    })
    dispatch(sliceInjectNoOp())
  }

  const panelState = useAppSelector(state => state.singingAnalysis)
  const isEnabled = panelState?.isEnabled ?? false
  const isAnalyzing = panelState?.isAnalyzing ?? false
  const isMicrophoneError = panelState?.isMicrophoneError ?? false
  const currentNote = panelState?.currentNote ?? null
  const currentCents = panelState?.currentCents ?? null
  const score = panelState?.score ?? 0
  const pitchHistory = panelState?.pitchHistory

  // ── Audio engine instance – created once on mount, cleaned up on unmount ──
  const analysisRef = useRef<SingingAnalysis | null>(null)

  // ── Canvas ref for pitch graph ────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── Lifecycle: create and destroy the SingingAnalysis instance ───────────
  useEffect(() => {
    analysisRef.current = new SingingAnalysis()
    return () => {
      analysisRef.current?.stopAnalysis()
      analysisRef.current = null
    }
  }, [])

  // ── Redraw graph whenever pitch history changes ───────────────────────────
  useEffect(() => {
    if (canvasRef.current && isEnabled && pitchHistory) {
      drawPitchGraph(canvasRef.current, pitchHistory)
    }
  }, [pitchHistory, isEnabled])

  // ── Stop analysis when panel is disabled ─────────────────────────────────
  useEffect(() => {
    if (!isEnabled && analysisRef.current?.isAnalyzing) {
      analysisRef.current?.stopAnalysis()
      dispatch(setAnalyzing(false))
    }
  }, [isEnabled, dispatch])

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleTogglePanel = useCallback(() => {
    dispatch(setEnabled(!isEnabled))
  }, [dispatch, isEnabled])

  const handleToggleMic = useCallback(async () => {
    if (!analysisRef.current) return

    if (isAnalyzing) {
      analysisRef.current.stopAnalysis()
      dispatch(setAnalyzing(false))
    } else {
      dispatch(setMicrophoneError(false))
      dispatch(setAnalyzing(true))

      await analysisRef.current.startAnalysis({
        onPitchSample: (sample: PitchSample) => {
          dispatch(addPitchSample(sample))
        },
        onError: () => {
          dispatch(setMicrophoneError(true))
        },
      })

      // startAnalysis sets isAnalyzing=false internally on error; keep Redux in sync
      if (!analysisRef.current.isAnalyzing) {
        dispatch(setAnalyzing(false))
      }
    }
  }, [dispatch, isAnalyzing])

  const handleReset = useCallback(() => {
    dispatch(resetScore())
  }, [dispatch])

  // ── Cents meter position ──────────────────────────────────────────────────
  // Map -50…+50 cents to 0…100% with 50% = in-tune centre
  const centsPct = currentCents != null
    ? Math.max(0, Math.min(100, 50 + currentCents))
    : 50

  const centsClass = currentCents == null
    ? ''
    : Math.abs(currentCents) <= 25
      ? styles.inTune
      : styles.offPitch

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Always-visible toggle button */}
      <button
        className={clsx(styles.toggleBtn, isEnabled && styles.active)}
        onClick={handleTogglePanel}
        aria-label={isEnabled ? 'Hide singing analysis' : 'Show singing analysis'}
        title={isEnabled ? 'Hide singing analysis' : 'Show singing analysis'}
      >
        🎤
      </button>

      {/* Panel – only rendered when enabled */}
      {isEnabled && (
        <div className={styles.panel} role='region' aria-label='Singing analysis'>

          {/* Header */}
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🎤 Singing Score</span>
            <button
              className={styles.closeBtn}
              onClick={handleTogglePanel}
              aria-label='Close'
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className={styles.panelBody}>

            {/* Note + score row */}
            <div className={styles.statusRow}>
              <div className={clsx(styles.noteDisplay, !currentNote && styles.noNote)}>
                {currentNote ?? '–'}
              </div>
              <div className={styles.scoreDisplay}>
                <div className={styles.scoreValue}>{score}</div>
                <div className={styles.scoreLabel}>Score</div>
              </div>
            </div>

            {/* Cents deviation meter */}
            <div className={styles.centsMeter}>
              <span>♭</span>
              <div className={styles.centsBar}>
                <div
                  className={clsx(styles.centsFill, centsClass)}
                  style={{ left: `calc(${centsPct}% - 2px)` }}
                />
              </div>
              <span>♯</span>
            </div>

            {/* Pitch graph */}
            <canvas
              ref={canvasRef}
              className={styles.graphCanvas}
              width={300}
              height={64}
              aria-label='Pitch history graph'
            />

            {/* Microphone error */}
            {isMicrophoneError && (
              <div className={styles.errorMsg}>
                Microphone access denied or unavailable.
              </div>
            )}

            {/* Controls */}
            <div className={styles.controls}>
              <button
                className={clsx(styles.micBtn, isAnalyzing && styles.recording)}
                onClick={handleToggleMic}
                disabled={isMicrophoneError && !isAnalyzing}
                aria-label={isAnalyzing ? 'Stop microphone' : 'Start microphone'}
              >
                {isAnalyzing ? '⏹ Stop' : '● Start'}
              </button>
              <button
                className={styles.resetBtn}
                onClick={handleReset}
                aria-label='Reset score'
                title='Reset score'
              >
                ↺
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

export default SingingAnalysisPanel
