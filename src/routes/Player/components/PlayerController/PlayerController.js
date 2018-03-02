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
    emitEnter: PropTypes.func.isRequired,
    emitError: PropTypes.func.isRequired,
    emitLeave: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.emitEnter()
  }

  componentWillUnmount () {
    this.props.emitLeave()
  }

  componentDidUpdate (prevProps) {
    const { queueItem, isPlaying } = this.props

    // playing for first time?
    if (isPlaying && queueItem.queueId === -1) {
      return this.props.requestPlayNext()
    }

    if (prevProps.queueItem.queueId !== queueItem.queueId) {
      // otherwise we'll emit new item with old's progress
      return this.props.emitStatus({ position: 0 })
    }

    this.props.emitStatus()
  }

  componentWillUpdate (nextProps) {
    const { queueItem, isPlaying } = this.props

    if (queueItem.queueId !== nextProps.queueItem.queueId) {
      // cancel any pending status emits having an old queueId
      this.props.cancelStatus()

      // push notification
      this.overlay.upNow(nextProps.queueItem.username)
    }

    // improve play/pause feedback lag
    if (isPlaying !== nextProps.isPlaying) {
      this.props.cancelStatus()
    }
  }

  handleMediaRequestError = (msg) => {
    // stop loading spinner, etc.
    this.props.mediaRequestError(msg)

    // call generic error handler (stops playback, etc.)
    this.handleError(msg)
  }

  handleError = (msg) => {
    this.props.emitError(msg)
    this.overlay.error()
  }

  render () {
    const { queueItem, isAtQueueEnd, isErrored } = this.props
    const enablePlayer = queueItem.queueId !== -1 && !isAtQueueEnd && !isErrored
    // if (props.queueItem.queueId === -1) {
    //   return <ColorCycle title='PRESS PLAY TO BEGIN' />
    // }
    //
    // if (props.isAtQueueEnd) {
    //   return <ColorCycle title='CAN HAZ MOAR SONGZ?' />
    // }

    return (
      <div>
        {enablePlayer &&
          <Player
            queueItem={this.props.queueItem}
            volume={this.props.volume}
            isPlaying={this.props.isPlaying}
            onMediaRequest={this.props.mediaRequest}
            onMediaRequestSuccess={this.props.mediaRequestSuccess}
            onMediaRequestError={this.handleMediaRequestError}
            onStatus={this.props.emitStatus}
            onMediaEnd={this.props.requestPlayNext}
            onError={this.handleError}
            width={this.props.width}
            height={this.props.height}
          />
        }
        <PlayerTextOverlay
          ref={r => { this.overlay = r }}
          width={this.props.width}
          height={this.props.height}
        />
      </div>
    )
  }
}

export default PlayerController
