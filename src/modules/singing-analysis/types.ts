/**
 * Singing Analysis Module – shared TypeScript interfaces.
 *
 * These types are consumed by the core analysis class, Redux slice, and React
 * UI component.  Nothing outside this module depends on them, so they can
 * evolve freely without touching the rest of the codebase.
 */

/**
 * A single expected note event from song metadata.
 *
 * Add an `expectedNotes` array to a song to unlock pitch-accuracy and
 * timing-accuracy scoring:
 *
 * @example
 *   const notes: SongNote[] = [
 *     { time: 1.0, note: 392.00 },  // G4
 *     { time: 1.5, note: 440.00 },  // A4
 *   ]
 */
export interface SongNote {
  /** Time in seconds from the start of the song when this note should begin. */
  time: number
  /** Expected fundamental frequency in Hz (not a MIDI number or note name). */
  note: number
}

/**
 * A (user timestamp, expected timestamp) pair collected during timing analysis.
 * Each pair represents one detected voice onset matched to the nearest expected
 * note onset from the song metadata.
 */
export interface TimingPair {
  /** Wall-clock timestamp (ms since epoch) when the user's note was detected. */
  userTimestamp: number
  /** Wall-clock timestamp (ms since epoch) when the note was expected. */
  expectedTimestamp: number
}

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
   * Timing accuracy 0–100 when song metadata was supplied.
   * Reflects the fraction of detected note onsets that were within the
   * allowed timing window (±300 ms).  0 when no timing data is available.
   */
  timingAccuracy: number
  /**
   * Rolling history of the last N pitch samples used to render the real-time
   * pitch graph.
   *
   * NOTE: PitchSample objects are serialisable, so storing them in Redux is safe.
   */
  pitchHistory: PitchSample[]
}
