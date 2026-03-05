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
 *   - Running score (0–100) combining pitch accuracy and timing accuracy
 *   - Timing accuracy display (when song metadata is provided)
 *   - Scrolling pitch history graph (canvas) using PitchGraph
 *
 * Integration
 * -----------
 * The component lazily injects its own Redux slice so there is zero bundle
 * overhead when the panel is not in use.  It is rendered after all existing
 * player components and is absolutely positioned, so it does not affect
 * layout.
 *
 * @param props.songMetadata - Optional expected note events.  When provided,
 *   timing accuracy is tracked and factored into the score (pitch × 70% +
 *   timing × 30%).
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
  setScore,
  sliceInjectNoOp,
} from '../../store/singingAnalysisSlice'
import { PitchGraph } from '../../pitchGraph'
import type { PitchSample, SongNote } from '../../types'
import styles from './SingingAnalysisPanel.css'

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

interface SingingAnalysisPanelProps {
  /**
   * Optional array of expected note events from song metadata.  When provided
   * the analysis engine tracks note-onset timing and blends timing accuracy
   * (30%) with pitch accuracy (70%) into the displayed score.
   */
  songMetadata?: SongNote[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SingingAnalysisPanel: React.FC<SingingAnalysisPanelProps> = ({ songMetadata }) => {
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
  const timingAccuracy = panelState?.timingAccuracy ?? 0
  const pitchHistory = panelState?.pitchHistory
  const hasTimingData = timingAccuracy > 0

  // ── Audio engine instance – created once on mount, cleaned up on unmount ──
  const analysisRef = useRef<SingingAnalysis | null>(null)

  // ── PitchGraph instance – canvas-based real-time pitch visualisation ──────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const graphRef = useRef<PitchGraph | null>(null)

  // Track how many samples have already been fed to the graph so that
  // re-renders don't re-add the same samples.
  const lastGraphLengthRef = useRef(0)

  // ── Lifecycle: create/destroy the SingingAnalysis instance ───────────────
  useEffect(() => {
    analysisRef.current = new SingingAnalysis()
    return () => {
      analysisRef.current?.stopAnalysis()
      analysisRef.current = null
    }
  }, [])

  // ── Lifecycle: create/destroy the PitchGraph instance ────────────────────
  useEffect(() => {
    if (canvasRef.current) {
      graphRef.current = new PitchGraph(canvasRef.current, { maxSamples: 100 })
    }
    return () => {
      graphRef.current = null
    }
  }, [])

  // ── Feed only *new* pitch samples into the graph ──────────────────────────
  useEffect(() => {
    if (!isEnabled || !pitchHistory || !graphRef.current) return
    const prev = lastGraphLengthRef.current
    for (let i = prev; i < pitchHistory.length; i++) {
      const sample = pitchHistory[i]
      graphRef.current.addSample(
        sample.frequency,
        sample.expectedFrequency ?? null,
      )
    }
    lastGraphLengthRef.current = pitchHistory.length
  }, [pitchHistory, isEnabled])

  // ── Clear the graph when analysis resets ─────────────────────────────────
  useEffect(() => {
    if (!isAnalyzing) {
      graphRef.current?.clear()
      lastGraphLengthRef.current = 0
    }
  }, [isAnalyzing])

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
      // Dispatch the final combined score (including timing) before stopping
      dispatch(setScore(analysisRef.current.getScore()))
      dispatch(setAnalyzing(false))
    } else {
      dispatch(setMicrophoneError(false))
      dispatch(setAnalyzing(true))

      await analysisRef.current.startAnalysis(
        {
          onPitchSample: (sample: PitchSample) => {
            dispatch(addPitchSample(sample))
            // Also dispatch combined score so timing accuracy is reflected
            if (analysisRef.current) {
              dispatch(setScore(analysisRef.current.getScore()))
            }
          },
          onError: () => {
            dispatch(setMicrophoneError(true))
          },
        },
        songMetadata,
      )

      // startAnalysis sets isAnalyzing=false internally on error; keep Redux in sync
      if (!analysisRef.current.isAnalyzing) {
        dispatch(setAnalyzing(false))
      }
    }
  }, [dispatch, isAnalyzing, songMetadata])

  const handleReset = useCallback(() => {
    graphRef.current?.clear()
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

            {/* Timing accuracy row – only shown when timing data is available */}
            {hasTimingData && (
              <div className={styles.timingRow}>
                <span className={styles.timingLabel}>Timing</span>
                <span className={styles.timingValue}>
                  {timingAccuracy}
                  %
                </span>
              </div>
            )}

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

            {/* Pitch graph (drawn by PitchGraph instance onto the canvas) */}
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
