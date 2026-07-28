import React from 'react'
import Spinner from 'components/Spinner/Spinner'
import CDGPlayer from './CDGPlayer/CDGPlayer'
import MP4Player from './MP4Player/MP4Player'
import MP4AlphaPlayer from './MP4Player/MP4AlphaPlayer'
import { type PlayerState } from '../../modules/player'
import { type PlayerVisualizerState } from '../../modules/playerVisualizer'

const PlayerVisualizer = React.lazy(() => import('./PlayerVisualizer/PlayerVisualizer'))

// kept below full scale to absorb resampler overshoot
const HEADROOM_DB = 0.5

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

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
  visualizerAudioSourceNode: MediaElementAudioSourceNode | null
}

class Player extends React.Component<PlayerProps> {
  audioCtx: AudioContext | null = null
  audioGainNode: GainNode | null = null
  audioSourceNode: MediaElementAudioSourceNode | null = null
  isFetching = false // internal
  appliedRG: { gain?: number | null, peak?: number | null } = {} // RG values latched at play

  state: State = {
    visualizerAudioSourceNode: null,
  }

  componentDidMount () {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      this.audioGainNode = this.audioCtx.createGain()
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
  }

  handleAudioElement = (el: HTMLVideoElement | HTMLAudioElement) => {
    if (!this.audioCtx || (this.audioSourceNode && this.audioSourceNode.mediaElement === el)) {
      return
    }

    this.audioSourceNode = this.audioCtx.createMediaElementSource(el)
    this.audioSourceNode.connect(this.audioGainNode)
    this.audioGainNode.connect(this.audioCtx.destination)

    // hand back copy of original audio source
    const sourceNodeCopy = this.audioSourceNode
    this.setState({ visualizerAudioSourceNode: sourceNodeCopy })
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
      && this.state.visualizerAudioSourceNode

    return (
      <>
        <PlayerComponent
          {...this.props}
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
              audioSourceNode={this.state.visualizerAudioSourceNode}
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
