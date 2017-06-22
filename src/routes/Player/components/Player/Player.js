import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers'
import ColorCycle from '../ColorCycle'

class Player extends React.Component {
  static propTypes = {
    queueId: PropTypes.number,
    queueItem: PropTypes.object,
    isAtQueueEnd: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
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
    const { queueId, isPlaying, volume } = this.props
    const status = {
      isPlaying,
      volume,
    }

    // playing for first time?
    if (isPlaying && queueId === null) {
      this.props.requestPlayNext()
      return
    }

    if (prevProps.queueId !== queueId) {
      // otherwise we'll emit new item with old's progress
      status.position = 0
    }

    this.props.emitStatus(status)
  }

  componentWillUpdate (nextProps) {
    // cancel any pending status emits having an old queueId
    if (this.props.queueId !== nextProps.queueId) {
      this.props.cancelStatus()
    }

    // improve play/pause feedback lag
    if (this.props.isPlaying !== nextProps.isPlaying) {
      this.props.cancelStatus()
    }
  }

  render () {
    const { props } = this

    if (typeof props.queueItem !== 'object') {
      return <ColorCycle title='PRESS PLAY TO BEGIN' />
    }

    if (typeof Providers[props.queueItem.provider] === 'undefined') {
      return <ColorCycle title={`Provider not found: ${props.queueItem.provider}`} />
    }

    if (props.isErrored) {
      return <ColorCycle title='crap' />
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
        getMedia={props.getMedia}
        getMediaSuccess={props.getMediaSuccess}
        onStatus={props.emitStatus}
        onMediaEnd={props.requestPlayNext}
        onMediaError={this.handleError}
        width={props.width}
        height={props.height}
      />
    )
  }

  handleError = (err) => {
    this.props.emitError(this.props.queueId, err)
  }
}

export default Player
