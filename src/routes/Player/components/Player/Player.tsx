import React from 'react'
import Spinner from 'components/Spinner/Spinner'
import CDGPlayer from './CDGPlayer/CDGPlayer'
import MP4Player from './MP4Player/MP4Player'
import MP4AlphaPlayer from './MP4Player/MP4AlphaPlayer'
import { pitchShifterEngine, type PitchShifter } from 'lib/pitchShifter'
import { type PlayerState } from '../../modules/player'
import { type PlayerVisualizerState } from '../../modules/playerVisualizer'

const PlayerVisualizer = React.lazy(() => import('./PlayerVisualizer/PlayerVisualizer'))

// kept below full scale to absorb resampler overshoot
const HEADROOM_DB = 0.5

// time constant (s) of the fades that cover pitch shifter (dis)engagement;
// ~99% settled after 5τ
const PITCH_FADE_TAU = 0.003

// a faded-out shifter is torn down after this (ms), well past settled
const PITCH_FADE_RELEASE_MS = 50

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

/**
 * Exponential approach rather than a linear ramp: it starts from wherever the
 * gain currently is, so a fade interrupted by another (quick 0 → n → 0) never
 * jumps.
 */
function fadeTo (param: AudioParam, value: number, startTime: number) {
  param.cancelScheduledValues(startTime)
  param.setTargetAtTime(value, startTime, PITCH_FADE_TAU)
}

/**
 * The dB adjustment to apply for a track, or null when the values are unusable.
 * Values can come from tags, which are garbage often enough to check.
 */
function replayGainDb (gainDb: number, peak: number): number | null {
  if (!Number.isFinite(gainDb) || !Number.isFinite(peak) || peak <= 0) return null

  // never let the gain push the track's peak up to full scale
  return clamp(Math.min(gainDb, -HEADROOM_DB - 20 * Math.log10(peak)), -60, 20)
}

interface PlayerProps {
  cdgAlpha: number
  cdgSize: number
  isFetching: boolean
  isPlaying: boolean
  isVisible: boolean
  isReplayGainEnabled: boolean
  isVideoKeyingEnabled: boolean
  isWebGLSupported: boolean
  mediaId: number
  mediaKey: number
  mediaReplayKey?: number
  mediaSrc?: string | null
  mediaType?: string
  mp4Alpha: number
  pitch: number
  rgTrackGain?: number | null
  rgTrackPeak?: number | null
  visualizer: PlayerVisualizerState
  volume: number
  width: number
  height: number
  // media events
  onEnd(): void
  onError(error: string): void
  onLoad(): void
  onPlay(): void
  onStatus(status: Partial<PlayerState>): void
}

interface State {
  audioLatency: number
  pitchShifterState: 'unavailable' | 'loading' | 'ready'
  visualizerAudioNode: AudioNode | null
}

class Player extends React.Component<PlayerProps> {
  audioCtx: AudioContext | null = null
  audioGainNode: GainNode | null = null
  audioPitchBusNode: GainNode | null = null
  audioDryNode: GainNode | null = null
  audioSourceNode: MediaElementAudioSourceNode | null = null
  pitchShifter: PitchShifter | null = null
  pitchShifterGain: GainNode | null = null
  isFetching = false // internal
  appliedRG: { gain?: number | null, peak?: number | null } = {} // RG values latched at play

  state: State = {
    audioLatency: 0,
    pitchShifterState: pitchShifterEngine.isSupported() ? 'loading' : 'unavailable',
    visualizerAudioNode: null,
  }

  /**
   * Whether playback should wait for the shifter. Only while one is actually
   * coming: if it can't be had there's nothing to wait for, and holding would
   * stall the song forever.
   */
  get isAwaitingPitchShifter () {
    return this.props.pitch !== 0 && this.state.pitchShifterState === 'loading'
  }

  componentDidMount () {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      this.audioGainNode = this.audioCtx.createGain()

      // permanent post-pitch tap point; the pitch shifter is
      // (dis)engaged on the source → bus leg only
      this.audioPitchBusNode = this.audioCtx.createGain()
      this.audioPitchBusNode.connect(this.audioGainNode)

      // bypass leg, always connected; faded rather than (dis)connected so
      // switching never cuts the waveform mid-cycle
      this.audioDryNode = this.audioCtx.createGain()
      this.audioDryNode.connect(this.audioPitchBusNode)

      if (this.state.pitchShifterState === 'loading') {
        pitchShifterEngine.prepare(this.audioCtx)
          .then(() => {
            // apply any pitch commanded while preparing, and release playback
            // if it was waiting on us
            this.setState({ pitchShifterState: 'ready' }, this.updatePitch)
            return
          })
          .catch(() => {
            this.setState({ pitchShifterState: 'unavailable' })
            this.props.onStatus({ isPitchSupported: false, pitch: 0 })
          })
      }
    }

    this.updateVolume()
  }

  componentDidUpdate (prevProps: PlayerProps) {
    // may have been suspended by browser if no user interaction yet
    if (this.props.isPlaying && !prevProps.isPlaying) {
      this.audioCtx?.resume()
    }

    // prevent applying next song's RG vals prematurely
    if (this.props.mediaKey !== prevProps.mediaKey) {
      this.isFetching = true
    }

    // don't change volume if we know we're changing songs; RG value changes
    // deliberately don't re-apply until the next play event (never mid-song)
    if (!this.isFetching && (prevProps.volume !== this.props.volume
      || prevProps.isReplayGainEnabled !== this.props.isReplayGainEnabled)) {
      this.updateVolume()
    }

    if (prevProps.pitch !== this.props.pitch) {
      this.updatePitch()
    }
  }

  componentWillUnmount () {
    this.releasePitchShifter(false)
  }

  handleAudioElement = (el: HTMLVideoElement | HTMLAudioElement) => {
    if (!this.audioCtx || (this.audioSourceNode && this.audioSourceNode.mediaElement === el)) {
      return
    }

    // new media element; discard routing tied to the old source
    // (safe to fully disconnect since the visualizer taps the pitch bus)
    this.audioSourceNode?.disconnect()
    this.releasePitchShifter(false)

    this.audioSourceNode = this.audioCtx.createMediaElementSource(el)
    this.audioSourceNode.connect(this.audioDryNode)
    this.audioGainNode.connect(this.audioCtx.destination)
    this.updatePitch() // wires source → [pitchShifter →] pitch bus

    this.setState({ visualizerAudioNode: this.audioPitchBusNode })
  }

  handlePlay = () => {
    this.isFetching = false
    this.appliedRG = { gain: this.props.rgTrackGain, peak: this.props.rgTrackPeak }
    this.logReplayGain()
    this.updateVolume()
    this.props.onPlay()
  }

  // once per song, and the only place that reports what was actually applied
  logReplayGain = () => {
    if (!this.props.isReplayGainEnabled) return

    const { gain, peak } = this.appliedRG
    const adjustDb = replayGainDb(gain, peak)

    if (adjustDb === null) {
      console.info('[ReplayGain] mediaId %s: no values; playing at room volume', this.props.mediaId)
      return
    }

    console.info('[ReplayGain] mediaId %s: applying %sdB%s (track gain %sdB, peak %s)',
      this.props.mediaId, adjustDb.toFixed(2),
      adjustDb < gain ? ', reduced to stay below clipping' : '',
      gain.toFixed(2), peak.toFixed(4))
  }

  handleError = (error: string) => {
    // otherwise volume changes are ignored until the next successful play
    this.isFetching = false
    this.props.onError(error)
  }

  updatePitch = () => {
    const source = this.audioSourceNode

    if (!this.audioCtx || !this.audioPitchBusNode || !this.audioDryNode || !source) return

    if (this.props.pitch === 0 || this.state.pitchShifterState !== 'ready') {
      // bypass: dry leg only (no added latency)
      this.releasePitchShifter(true)

      if (this.state.audioLatency !== 0) {
        this.setState({ audioLatency: 0 })
      }

      return
    }

    if (!this.pitchShifter) {
      // fresh instance per engagement; released on return to 0
      const shifter = pitchShifterEngine.create(this.audioCtx)
      const shifterGain = this.audioCtx.createGain()
      const dryGain = this.audioDryNode.gain

      shifterGain.gain.value = 0
      shifterGain.connect(this.audioPitchBusNode)
      shifter.node.connect(shifterGain)
      source.connect(shifter.node)

      this.pitchShifter = shifter
      this.pitchShifterGain = shifterGain

      // keep the dry leg until the shifter is up to level, then crossfade
      // (repeats that much audio rather than leaving a gap)
      shifter.fullLevelAt.then((time) => {
        if (this.pitchShifter !== shifter) return // released meanwhile

        fadeTo(dryGain, 0, time)
        fadeTo(shifterGain.gain, 1, time)
        return
      }).catch(() => {})

      this.setState({ audioLatency: shifter.latency })
    }

    this.pitchShifter.setPitchSemitones(this.props.pitch)
  }

  // detaches the current shifter and restores the dry leg, optionally
  // crossfading rather than switching
  releasePitchShifter (isFading: boolean) {
    const { audioSourceNode: source, pitchShifter, pitchShifterGain } = this
    const dryGain = this.audioDryNode.gain
    const now = this.audioCtx.currentTime

    if (!pitchShifter) return

    this.pitchShifter = null
    this.pitchShifterGain = null

    const dispose = () => {
      try {
        // an input keeps the worklet processing even with its output detached
        source?.disconnect(pitchShifter.node)
      } catch {
        // wasn't connected
      }

      pitchShifter.dispose()
      pitchShifterGain.disconnect()
    }

    if (!isFading) {
      dryGain.cancelScheduledValues(0)
      dryGain.setValueAtTime(1, now)
      dispose()
      return
    }

    fadeTo(dryGain, 1, now)
    fadeTo(pitchShifterGain.gain, 0, now)
    setTimeout(dispose, PITCH_FADE_RELEASE_MS)
  }

  updateVolume = () => {
    let vol = this.props.volume
    const { gain, peak } = this.appliedRG
    const adjustDb = this.props.isReplayGainEnabled ? replayGainDb(gain, peak) : null

    // no upper clamp on vol: the peak clamp already guarantees headroom, and
    // clamping would defeat boosting quiet tracks
    if (adjustDb !== null) {
      vol = vol * Math.pow(10, adjustDb / 20) // dB to linear amplitude factor
    }

    if (this.audioCtx && this.audioGainNode) {
      this.audioGainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime)
    }
  }

  render () {
    if (!this.props.isVisible || typeof this.props.mediaId !== 'number') return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let PlayerComponent: React.ComponentType<any> | undefined

    if (this.props.mediaType === 'cdg') PlayerComponent = CDGPlayer
    else if (this.props.mediaType === 'mp4') PlayerComponent = this.props.isVideoKeyingEnabled ? MP4AlphaPlayer : MP4Player

    if (typeof PlayerComponent === 'undefined') {
      this.props.onError(`No player for mediaType: ${this.props.mediaType}`)
      return null
    }

    const isVisualizerActive = (this.props.mediaType === 'cdg' || this.props.isVideoKeyingEnabled)
      && this.props.isWebGLSupported
      && this.props.visualizer.isEnabled
      && this.state.visualizerAudioNode

    return (
      <>
        <PlayerComponent
          {...this.props}
          audioLatency={this.state.audioLatency}
          // hold playback rather than start unshifted and jump when the
          // worklet module lands; the isFetching spinner covers the wait
          isPlaying={this.props.isPlaying && !this.isAwaitingPitchShifter}
          onAudioElement={this.handleAudioElement}
          onError={this.handleError}
          onPlay={this.handlePlay}
        />
        {this.props.isFetching && (
          <div style={{ position: 'absolute', width: this.props.width, height: this.props.height }}>
            <Spinner />
          </div>
        )}
        {isVisualizerActive && (
          <React.Suspense
            fallback={this.props.isFetching
              ? null
              : (
                  <div style={{ position: 'absolute', zIndex: -1, width: this.props.width, height: this.props.height }}>
                    <Spinner />
                  </div>
                )}
          >
            <PlayerVisualizer
              audioNode={this.state.visualizerAudioNode}
              isPlaying={this.props.isPlaying}
              onError={this.props.onError}
              presetKey={this.props.visualizer.presetKey}
              sensitivity={this.props.visualizer.sensitivity}
              width={this.props.width}
              height={this.props.height}
            />
          </React.Suspense>
        )}
      </>
    )
  }
}

export default Player
