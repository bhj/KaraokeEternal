import PropTypes from 'prop-types'
import React from 'react'
import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'
import PlayerVisualizer from '../PlayerVisualizer'

window._audioCtx = new (window.AudioContext || window.webkitAudioContext)()

class PlayerController extends React.Component {
  static propTypes = {
    alpha: PropTypes.number.isRequired,
    isAlphaSupported: PropTypes.bool.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isPlayingNext: PropTypes.bool.isRequired,
    isQueueEmpty: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    queue: PropTypes.object.isRequired,
    queueId: PropTypes.number.isRequired,
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
    const { isPlaying, isPlayingNext, isAtQueueEnd, queueId, visualizer } = this.props

    // playing for first time or playing next?
    if (isPlaying && (queueId === -1 || isPlayingNext)) {
      this.handleLoadNext()
    }

    // check if queue is no longer exhausted
    if (isAtQueueEnd && prevProps.queue.result !== this.props.queue.result) {
      this.handleLoadNext()
    }

    // may have been suspended by browser if no user interaction yet
    if (prevProps.isPlaying !== isPlaying) {
      window._audioCtx.resume()
      this.props.cancelStatus()
    }

    // improve client ui responsiveness
    if (prevProps.queueId !== queueId) {
      this.props.cancelStatus()
      this.props.emitStatus({ position: 0 })
      return
    }

    // improve client ui responsiveness
    if (prevProps.visualizer.isEnabled !== visualizer.isEnabled) {
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

  handleLoadNext = () => {
    const curIdx = this.props.queue.result.indexOf(this.props.queueId)

    // queue exhausted?
    if (curIdx === this.props.queue.result.length - 1) {
      this.props.queueEnd()
      return
    }

    this.props.loadQueueItem(this.props.queue.result[curIdx + 1])
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
            sensitivity={props.visualizer.sensitivity}
            width={props.width}
            height={props.height}
            volume={props.volume}
          />
        }
        {queueItem.queueId !== -1 && !props.isErrored && !props.isAtQueueEnd &&
          <Player
            alpha={props.alpha}
            queueItem={queueItem}
            volume={props.volume}
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
