import PropTypes from 'prop-types'
import React from 'react'
import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'
import PlayerVisualizer from '../PlayerVisualizer'

class PlayerController extends React.Component {
  static propTypes = {
    alpha: PropTypes.number.isRequired,
    isAlphaSupported: PropTypes.bool.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isPlayingNext: PropTypes.bool.isRequired,
    isQueueEmpty: PropTypes.bool.isRequired,
    isReplayGainEnabled: PropTypes.bool.isRequired,
    queue: PropTypes.object.isRequired,
    queueId: PropTypes.number.isRequired,
    rgTrackGain: PropTypes.number,
    rgTrackPeak: PropTypes.number,
    visualizer: PropTypes.object.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    cancelStatus: PropTypes.func.isRequired,
    emitLeave: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    loadQueueItem: PropTypes.func.isRequired,
    mediaElementChange: PropTypes.func.isRequired,
    mediaRequest: PropTypes.func.isRequired,
    mediaRequestSuccess: PropTypes.func.isRequired,
    mediaRequestError: PropTypes.func.isRequired,
    playerError: PropTypes.func.isRequired,
    queueEnd: PropTypes.func.isRequired,
  }

  state = {
    audioSourceNode: null,
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  audioGainNode = this.audioCtx.createGain()

  // simplify player logic; if this reference changes on each
  // render it will cause an infinite loop of status updates
  defaultQueueItem = {
    queueId: -1,
  }

  componentDidMount () {
    this.props.emitStatus()
    this.audioGainNode.gain.setValueAtTime(this.props.volume, this.audioCtx.currentTime)
  }

  componentWillUnmount () {
    this.props.cancelStatus()
    this.props.emitLeave()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    // playing for first time or playing next?
    if (props.isPlaying && (props.queueId === -1 || props.isPlayingNext)) {
      this.handleLoadNext()
    }

    // queue was exhausted, but is no longer?
    if (props.isAtQueueEnd && prevProps.queue.result !== props.queue.result) {
      this.handleLoadNext()
    }

    // volume or replaygain params changed?
    if (prevProps.volume !== props.volume ||
        prevProps.rgTrackGain !== props.rgTrackGain ||
        prevProps.rgTrackPeak !== props.rgTrackPeak ||
        prevProps.isReplayGainEnabled !== props.isReplayGainEnabled) {
      this.updateVolume()
    }

    // may have been suspended by browser if no user interaction yet
    if (prevProps.isPlaying !== props.isPlaying) {
      this.audioCtx.resume()
      this.props.cancelStatus()
    }

    // improve client ui responsiveness
    if (prevProps.queueId !== props.queueId) {
      this.props.cancelStatus()
      this.props.emitStatus({ position: 0 })
      return
    }

    // improve client ui responsiveness
    if (prevProps.visualizer.isEnabled !== props.visualizer.isEnabled) {
      this.props.cancelStatus()
    }

    this.props.emitStatus()
  }

  handleMediaElement = (el, mediaInfo) => {
    this.setState({ audioSourceNode: this.audioCtx.createMediaElementSource(el) }, () => {
      const sourceNodeCopy = this.state.audioSourceNode
      sourceNodeCopy.connect(this.audioGainNode)
      this.audioGainNode.connect(this.audioCtx.destination)
    })

    // isAlphaSupported, etc.
    this.props.mediaElementChange(mediaInfo)
  }

  handleMediaRequestError = msg => {
    this.props.mediaRequestError(msg)
  }

  handleError = msg => {
    this.props.playerError(msg)
  }

  handleLoadNext = () => {
    const curIdx = this.props.queue.result.indexOf(this.props.queueId)

    // queue exhausted?
    if (curIdx === this.props.queue.result.length - 1) {
      this.props.queueEnd()
      return
    }

    this.props.loadQueueItem(this.props.queue.entities[this.props.queue.result[curIdx + 1]])
  }

  updateVolume = () => {
    const gainDb = this.props.rgTrackGain
    const peakDb = 10 * Math.log10(this.props.rgTrackPeak) // ratio to dB
    const safeGainDb = (gainDb + peakDb >= 0) ? -0.01 - peakDb : gainDb

    this.audioGainNode.gain.setValueAtTime(this.props.volume * Math.pow(10, safeGainDb / 10), this.audioCtx.currentTime)
  }

  render () {
    const { props, state } = this
    const queueItem = props.queueId === -1 ? this.defaultQueueItem : props.queue.entities[props.queueId]

    return (
      <>
        {state.audioSourceNode && props.isAlphaSupported && props.visualizer.isSupported && props.visualizer.isEnabled &&
          <PlayerVisualizer
            audioSourceNode={state.audioSourceNode}
            isPlaying={props.isPlaying}
            presetKey={props.visualizer.presetKey}
            queueItem={queueItem}
            width={props.width}
            height={props.height}
            volume={props.volume}
          />
        }
        {queueItem.queueId !== -1 && !props.isErrored && !props.isAtQueueEnd &&
          <Player
            alpha={props.alpha}
            queueItem={queueItem}
            isPlaying={props.isPlaying}
            onMediaElement={this.handleMediaElement}
            onMediaRequest={props.mediaRequest}
            onMediaRequestSuccess={props.mediaRequestSuccess}
            onMediaRequestError={this.handleMediaRequestError}
            onStatus={props.emitStatus}
            onMediaEnd={this.handleLoadNext}
            onError={this.handleError}
            width={props.width}
            height={props.height}
          />
        }
        <PlayerTextOverlay
          queueItem={queueItem}
          isAtQueueEnd={props.isAtQueueEnd}
          isQueueEmpty={props.isQueueEmpty}
          isErrored={props.isErrored}
          width={props.width}
          height={props.height}
        />
      </>
    )
  }
}

export default PlayerController
