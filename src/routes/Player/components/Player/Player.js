import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers'
import ColorCycle from '../ColorCycle'

class Player extends React.Component {
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
      this.props.requestPlayNext()
      return
    }

    if (prevProps.queueItem.queueId !== queueItem.queueId) {
      // otherwise we'll emit new item with old's progress
      this.props.emitStatus({ position: 0 })
    }

    this.props.emitStatus()
  }

  componentWillUpdate (nextProps) {
    const { queueItem, isPlaying } = this.props

    // cancel any pending status emits having an old queueId
    if (queueItem.queueId !== nextProps.queueItem.queueId) {
      this.props.cancelStatus()
    }

    // improve play/pause feedback lag
    if (isPlaying !== nextProps.isPlaying) {
      this.props.cancelStatus()
    }
  }

  render () {
    const { props } = this

    if (props.queueItem.queueId === -1) {
      return <ColorCycle title='PRESS PLAY TO BEGIN' />
    }

    if (typeof Providers[props.queueItem.provider] === 'undefined') {
      return <ColorCycle title={`Provider not found: ${props.queueItem.provider}`} />
    }

    if (props.isErrored) {
      return <ColorCycle title='Something went wrong! (press Next to continue)' />
    }

    if (props.isAtQueueEnd) {
      return <ColorCycle title='CAN HAZ MOAR SONGZ?' />
    }

    // we have something to pass to a provider player
    const ProviderPlayer = Providers[props.queueItem.provider].playerComponent

    return (
      <ProviderPlayer
        queueItem={props.queueItem}
        volume={props.volume}
        isPlaying={props.isPlaying}
        mediaRequest={props.mediaRequest}
        mediaRequestSuccess={props.mediaRequestSuccess}
        mediaRequestError={props.mediaRequestError}
        onStatus={props.emitStatus}
        onMediaEnd={props.requestPlayNext}
        onMediaError={this.handleMediaError}
        width={props.width}
        height={props.height}
      />
    )
  }

  handleMediaError = (err) => {
    this.props.emitError(this.props.queueItem.queueId, err)
  }
}

export default Player
