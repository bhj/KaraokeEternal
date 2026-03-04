/**
 * Singing Analysis Module – shared TypeScript interfaces.
 *
 * These types are consumed by the core analysis class, Redux slice, and React
 * UI component.  Nothing outside this module depends on them, so they can
 * evolve freely without touching the rest of the codebase.
 */

/** A single pitch measurement captured from the microphone. */
export interface PitchSample {
  /** Wall-clock timestamp (ms since epoch). */
  timestamp: number
  /** Detected fundamental frequency in Hz, or null when silence/noise. */
  frequency: number | null
  /** Human-readable musical note name derived from `frequency` (e.g. "A4"). */
  noteName: string | null
  /** Deviation from the nearest equal-tempered note in cents (-50 … +50). */
  cents: number | null
  /**
   * Expected frequency at this instant (Hz), if sheet-music / MIDI data is
   * available.  When present, the scorer rewards in-tune singing.
   */
  expectedFrequency?: number
}

/** Callbacks used by the SingingAnalysis core class. */
export interface SingingAnalysisCallbacks {
  /** Called for every analysis frame (~10 fps by default). */
  onPitchSample: (sample: PitchSample) => void
  /** Called when an unrecoverable error occurs (e.g. microphone denied). */
  onError: (message: string) => void
}

/** Redux state slice shape for the singing-analysis feature. */
export interface SingingAnalysisState {
  /** Feature flag – when false the panel is not rendered at all. */
  isEnabled: boolean
  /** True while the microphone is actively capturing audio. */
  isAnalyzing: boolean
  /** True when microphone permission was denied or another mic error occurred. */
  isMicrophoneError: boolean
  /** Most-recently detected frequency (Hz) or null. */
  currentPitch: number | null
  /** Most-recently detected note name (e.g. "C#4") or null. */
  currentNote: string | null
  /** Cents deviation from perfect pitch for the current note, or null. */
  currentCents: number | null
  /** Running score 0–100 based on pitch clarity (and accuracy if expected notes are supplied). */
  score: number
  /**
   * Rolling history of the last N pitch samples used to render the real-time
   * pitch graph.
   *
   * NOTE: PitchSample objects are serialisable, so storing them in Redux is safe.
   */
  pitchHistory: PitchSample[]
}
