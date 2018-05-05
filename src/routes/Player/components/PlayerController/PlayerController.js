import PropTypes from 'prop-types'
import React from 'react'
import Player from '../Player'
import PlayerTextOverlay from '../PlayerTextOverlay'

class PlayerController extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    mediaRequest: PropTypes.func.isRequired,
    mediaRequestSuccess: PropTypes.func.isRequired,
    mediaRequestError: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    cancelStatus: PropTypes.func.isRequired,
    emitError: PropTypes.func.isRequired,
    emitLeave: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.emitStatus()
  }

  componentWillUnmount () {
    this.props.emitLeave()
  }

  componentDidUpdate (prevProps) {
    const { queueItem, isPlaying } = this.props

    // cancel any pending status emits having old info
    this.props.cancelStatus()

    // playing for first time?
    if (isPlaying && queueItem.queueId === -1) {
      this.props.requestPlayNext()
    }

    if (prevProps.queueItem.queueId !== queueItem.queueId) {
      // otherwise we'll emit new item with old's progress
      return this.props.emitStatus({ position: 0 })
    }

    this.props.emitStatus()
  }

  handleMediaRequestError = (msg) => {
    // stop loading spinner, etc.
    this.props.mediaRequestError(msg)

    // call generic error handler (stops playback, etc.)
    this.handleError(msg)
  }

  handleError = (msg) => {
    this.props.emitError(msg)
  }

  render () {
    return (
      <div>
        <Player
          queueItem={this.props.queueItem}
          volume={this.props.volume}
          isPlaying={this.props.isPlaying}
          isVisible={this.props.queueItem.queueId !== -1 && !this.props.isAtQueueEnd && !this.props.isErrored}
          onMediaRequest={this.props.mediaRequest}
          onMediaRequestSuccess={this.props.mediaRequestSuccess}
          onMediaRequestError={this.handleMediaRequestError}
          onStatus={this.props.emitStatus}
          onMediaEnd={this.props.requestPlayNext}
          onError={this.handleError}
          width={this.props.width}
          height={this.props.height}
        />
        <PlayerTextOverlay
          ref={r => { this.overlay = r }}
          queueItem={this.props.queueItem}
          isAtQueueEnd={this.props.isAtQueueEnd}
          isErrored={this.props.isErrored}
          width={this.props.width}
          height={this.props.height}
        />
      </div>
    )
  }
}

export default PlayerController
