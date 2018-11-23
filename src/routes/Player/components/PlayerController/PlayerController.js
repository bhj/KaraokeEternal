import PropTypes from 'prop-types'
import React from 'react'
import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'
import PlayerVisualizer from '../PlayerVisualizer'

window._audioCtx = new (window.AudioContext || window.webkitAudioContext)()

class PlayerController extends React.Component {
  static propTypes = {
    bgAlpha: PropTypes.number.isRequired,
    queueItem: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isQueueEmpty: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    visualizer: PropTypes.object.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    cancelStatus: PropTypes.func.isRequired,
    playerError: PropTypes.func.isRequired,
    emitLeave: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    mediaElementChange: PropTypes.func.isRequired,
    mediaRequest: PropTypes.func.isRequired,
    mediaRequestSuccess: PropTypes.func.isRequired,
    mediaRequestError: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
  }

  state = {
    audioSourceNode: null,
  }

  componentDidMount () {
    this.props.emitStatus()
  }

  componentWillUnmount () {
    this.props.cancelStatus()
    this.props.emitLeave()
  }

  componentDidUpdate (prevProps) {
    const { isPlaying, queueItem, visualizer } = this.props

    // playing for first time?
    if (isPlaying && queueItem.queueId === -1) {
      this.props.requestPlayNext()
    }

    // cancel pending emits with old info; improves ui responsiveness
    if (prevProps.queueItem.queueId !== queueItem.queueId ||
        prevProps.isPlaying !== isPlaying ||
        prevProps.visualizer.isEnabled !== visualizer.isEnabled) {
      this.props.cancelStatus()
    }

    this.props.emitStatus()
  }

  handleMediaElement = (el, mediaInfo) => {
    this.setState({ audioSourceNode: window._audioCtx.createMediaElementSource(el) }, () => {
      // route it back to the output, otherwise, silence
      this.state.audioSourceNode.connect(window._audioCtx.destination)
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

  render () {
    const { props, state } = this

    return (
      <>
        {state.audioSourceNode && props.visualizer.isSupported && props.visualizer.isEnabled &&
          <PlayerVisualizer
            audioSourceNode={state.audioSourceNode}
            isPlaying={props.isPlaying}
            presetKey={props.visualizer.presetKey}
            queueItem={props.queueItem}
            sensitivity={props.visualizer.sensitivity}
            width={props.width}
            height={props.height}
            volume={props.volume}
          />
        }
        <Player
          bgAlpha={props.bgAlpha}
          queueItem={props.queueItem}
          volume={props.volume}
          isErrored={props.isErrored}
          isPlaying={props.isPlaying}
          isVisible={props.queueItem.queueId !== -1 && !props.isAtQueueEnd}
          onMediaElement={this.handleMediaElement}
          onMediaRequest={props.mediaRequest}
          onMediaRequestSuccess={props.mediaRequestSuccess}
          onMediaRequestError={this.handleMediaRequestError}
          onStatus={props.emitStatus}
          onMediaEnd={props.requestPlayNext}
          onError={this.handleError}
          width={props.width}
          height={props.height}
        />
        <PlayerTextOverlay
          queueItem={props.queueItem}
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
