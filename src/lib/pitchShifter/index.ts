export interface PitchShifter {
  // the node to wire into the graph: source → node → downstream
  readonly node: AudioNode
  // seconds of added latency at current settings (for graphics compensation)
  readonly latency: number
  // context time (s) from which output is at full level; resolves once input
  // has reached the shifter. Crossfade onto it no earlier.
  readonly fullLevelAt: Promise<number>
  setPitchSemitones(semitones: number): void
  // disconnects outputs and releases resources; instance is unusable afterward
  dispose(): void
}

export interface PitchShifterEngine {
  // sync feature-detect; safe to call without an AudioContext
  isSupported(): boolean
  // one-time async setup (e.g. AudioWorklet module registration); must resolve before create()
  prepare(ctx: AudioContext): Promise<void>
  // a fresh instance, ready to connect; callers create on engage and dispose on disengage
  create(ctx: AudioContext): PitchShifter
}

export { phaseVocoderEngine as pitchShifterEngine } from './phaseVocoder'
