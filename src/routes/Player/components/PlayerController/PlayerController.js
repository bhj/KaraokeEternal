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
    mediaRequest: PropTypes.func.isRequired,
    mediaRequestSuccess: PropTypes.func.isRequired,
    mediaRequestError: PropTypes.func.isRequired,
    playerError: PropTypes.func.isRequired,
    queueEnd: PropTypes.func.isRequired,
  }

  state = {
    audioSourceNode: null,
  }

  // simplify player logic; if this reference changes on each
  // render it will cause an infinite loop of status updates
  defaultQueueItem = {
    queueId: -1,
  }

  componentDidMount () {
    this.props.emitStatus()
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
  }

  handleAudioSourceNode = (source) => {
    this.setState({ audioSourceNode: source })
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
            isReplayGainEnabled={props.isReplayGainEnabled}
            onAudioSourceNode={this.handleAudioSourceNode}
            onMediaRequest={props.mediaRequest}
            onMediaRequestSuccess={props.mediaRequestSuccess}
            onMediaRequestError={this.handleMediaRequestError}
            onStatus={props.emitStatus}
            onMediaEnd={this.handleLoadNext}
            onError={this.handleError}
            rgTrackGain={props.rgTrackGain}
            rgTrackPeak={props.rgTrackPeak}
            volume={props.volume}
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
