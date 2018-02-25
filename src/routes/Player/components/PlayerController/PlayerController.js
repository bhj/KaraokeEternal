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
    style: PropTypes.object.isRequired,
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
      this.overlay.upNext(nextProps.queueItem.username)
    }

    // improve play/pause feedback lag
    if (isPlaying !== nextProps.isPlaying) {
      this.props.cancelStatus()
    }
  }

  handleMediaError = (err) => {
    this.props.emitError(this.props.queueItem.queueId, err)
  }

  render () {
    const { props } = this

    // if (props.queueItem.queueId === -1) {
    //   return <ColorCycle title='PRESS PLAY TO BEGIN' />
    // }
    //
    // if (typeof Providers[props.queueItem.provider] === 'undefined') {
    //   return <ColorCycle title={`Provider not found: ${props.queueItem.provider}`} />
    // }
    //
    // if (props.isErrored) {
    //   return <ColorCycle title='Something went wrong! (press Next to continue)' />
    // }
    //
    // if (props.isAtQueueEnd) {
    //   return <ColorCycle title='CAN HAZ MOAR SONGZ?' />
    // }

    return (
      <div>
        <Player
          queueItem={props.queueItem}
          volume={props.volume}
          isPlaying={props.isPlaying}
          mediaRequest={props.mediaRequest}
          mediaRequestSuccess={props.mediaRequestSuccess}
          mediaRequestError={props.mediaRequestError}
          onStatus={props.emitStatus}
          onMediaEnd={props.requestPlayNext}
          onMediaError={this.handleMediaError}
          width={props.style.width}
          height={props.style.height}
        />
        <PlayerTextOverlay
          ref={r => { this.overlay = r }}
          style={props.style}
        />
      </div>
    )
  }
}

export default PlayerController
