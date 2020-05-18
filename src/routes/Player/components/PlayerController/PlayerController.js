import PropTypes from 'prop-types'
import React from 'react'
import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'
import PlayerVisualizer from '../PlayerVisualizer'

class PlayerController extends React.Component {
  static propTypes = {
    cdgAlpha: PropTypes.number.isRequired,
    cdgSize: PropTypes.number.isRequired,
    historyJSON: PropTypes.string.isRequired,
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
    emitLeave: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    playerError: PropTypes.func.isRequired,
    playerLoad: PropTypes.func.isRequired,
    playerPlay: PropTypes.func.isRequired,
    playerStatus: PropTypes.func.isRequired,
    playerVisualizerError: PropTypes.func.isRequired,
  }

  state = {
    audioSourceNode: null,
  }

  componentDidMount () {
    this.props.emitStatus()
  }

  componentWillUnmount () {
    this.props.emitLeave()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    // playing for first time or playing next?
    if ((props.isPlaying && props.queueId === -1) || props.isPlayingNext) {
      this.handleLoadNext()
      return
    }

    // queue was exhausted, but is no longer?
    if (props.isAtQueueEnd && prevProps.queue.result !== props.queue.result) {
      this.handleLoadNext()
      return
    }

    // re-trying after error?
    if (props.isErrored && props.isPlaying && !prevProps.isPlaying) {
      props.playerStatus({ isErrored: false })
      return
    }

    this.props.emitStatus()
  }

  handleAudioSourceNode = (source) => {
    this.setState({ audioSourceNode: source })
  }

  handleError = (msg) => {
    this.props.playerError(msg)
    this.props.emitStatus()
  }

  handleLoadNext = () => {
    const curIdx = this.props.queue.result.indexOf(this.props.queueId)

    // queue exhausted?
    if (curIdx === this.props.queue.result.length - 1) {
      this.props.playerStatus({
        isAtQueueEnd: true,
        isPlayingNext: false,
      })

      return
    }

    // update history of played items
    const history = JSON.parse(this.props.historyJSON)

    if (this.props.queueId !== -1) {
      history.push(this.props.queueId)
    }

    this.props.playerStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isPlayingNext: false,
      position: 0,
      queueId: this.props.queue.result[curIdx + 1],
    })
  }

  handleStatus = (status) => {
    this.props.playerStatus(status)
    this.props.emitStatus()
  }

  render () {
    const { props, state } = this
    const queueItem = props.queue.entities[props.queueId]

    return (
      <>
        <Player
          cdgAlpha={props.cdgAlpha}
          cdgSize={props.cdgSize}
          isPlaying={props.isPlaying}
          isVisible={!!queueItem && !props.isErrored && !props.isAtQueueEnd}
          isReplayGainEnabled={props.isReplayGainEnabled}
          mediaId={queueItem ? queueItem.mediaId : null}
          mediaKey={queueItem ? queueItem.queueId : null}
          mediaType={queueItem ? queueItem.player : null}
          onAudioSourceNode={this.handleAudioSourceNode}
          onEnd={this.handleLoadNext}
          onError={this.handleError}
          onLoad={props.playerLoad}
          onPlay={props.playerPlay}
          onStatus={this.handleStatus}
          rgTrackGain={props.rgTrackGain}
          rgTrackPeak={props.rgTrackPeak}
          volume={props.volume}
          width={props.width}
          height={props.height}
        />
        {state.audioSourceNode && props.isAlphaSupported && props.visualizer.isSupported && props.visualizer.isEnabled &&
          <PlayerVisualizer
            audioSourceNode={state.audioSourceNode}
            isPlaying={props.isPlaying}
            onError={props.playerVisualizerError}
            presetKey={props.visualizer.presetKey}
            width={props.width}
            height={props.height}
            volume={props.volume}
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
