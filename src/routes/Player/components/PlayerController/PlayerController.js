import PropTypes from 'prop-types'
import React from 'react'
import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'

class PlayerController extends React.Component {
  static propTypes = {
    cdgAlpha: PropTypes.number.isRequired,
    cdgSize: PropTypes.number.isRequired,
    historyJSON: PropTypes.string.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isPlayingNext: PropTypes.bool.isRequired,
    isQueueEmpty: PropTypes.bool.isRequired,
    isReplayGainEnabled: PropTypes.bool.isRequired,
    isWebGLSupported: PropTypes.bool.isRequired,
    mp4Alpha: PropTypes.number.isRequired,
    queue: PropTypes.object.isRequired,
    queueId: PropTypes.number.isRequired,
    rgTrackGain: PropTypes.number,
    rgTrackPeak: PropTypes.number,
    visualizer: PropTypes.object.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    playerLeave: PropTypes.func.isRequired,
    playerError: PropTypes.func.isRequired,
    playerLoad: PropTypes.func.isRequired,
    playerPlay: PropTypes.func.isRequired,
    playerStatus: PropTypes.func.isRequired,
  }

  state = {
    queueItem: null,
  }

  componentDidMount () {
    this.handleStatus()
    this.setState({ queueItem: this.props.queue.entities[this.props.queueId] }) // @todo: use getDerivedStateFromProps?
  }

  componentWillUnmount () {
    this.props.playerLeave()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (props.queueId !== prevProps.queueId) {
      this.setState({ queueItem: props.queue.entities[props.queueId] })
    }

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
      this.handleStatus({ isErrored: false })
      return
    }

    this.handleStatus()
  }

  handleError = (msg) => {
    this.props.playerError(msg)
    this.handleStatus()
  }

  handleLoadNext = () => {
    const curIdx = this.props.queue.result.indexOf(this.props.queueId)

    // queue exhausted?
    if (curIdx === this.props.queue.result.length - 1) {
      this.handleStatus({
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

    this.handleStatus({
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlaying: true,
      isPlayingNext: false,
      position: 0,
      queueId: this.props.queue.result[curIdx + 1],
    })
  }

  handleStatus = (status) => this.props.playerStatus({
    ...status,
    mediaType: this.state.queueItem ? this.state.queueItem.mediaType : null,
  })

  render () {
    const { props, state } = this

    return (
      <>
        <Player
          cdgAlpha={props.cdgAlpha}
          cdgSize={props.cdgSize}
          isPlaying={props.isPlaying}
          isVisible={!!state.queueItem && !props.isErrored && !props.isAtQueueEnd}
          isReplayGainEnabled={props.isReplayGainEnabled}
          isWebGLSupported={props.isWebGLSupported}
          mediaId={state.queueItem ? state.queueItem.mediaId : null}
          mediaKey={state.queueItem ? state.queueItem.queueId : null}
          mediaType={state.queueItem ? state.queueItem.mediaType : null}
          youtubeVideoId={state.queueItem ? state.queueItem.youtubeVideoId : null}
          youtubeAlignedLyrics={state.queueItem ? state.queueItem.youtubeAlignedLyrics : null}
          youtubeVideoDuration={state.queueItem ? state.queueItem.youtubeVideoDuration : null}
          mp4Alpha={props.mp4Alpha}
          onEnd={this.handleLoadNext}
          onError={this.handleError}
          onLoad={props.playerLoad}
          onPlay={props.playerPlay}
          onStatus={this.handleStatus}
          rgTrackGain={state.queueItem ? state.queueItem.rgTrackGain : null}
          rgTrackPeak={state.queueItem ? state.queueItem.rgTrackPeak : null}
          visualizer={props.visualizer}
          volume={props.volume}
          width={props.width}
          height={props.height}
        />
        <PlayerTextOverlay
          queueItem={state.queueItem}
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
