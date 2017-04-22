import PropTypes from 'prop-types'
import React from 'react'
import PlayerHeader from './PlayerHeader'
import Providers from 'components/providers'
import ColorCycle from './ColorCycle'
import classes from './PlayerView.css'
import screenfull from 'screenfull'

class PlayerView extends React.Component {
  static propTypes = {
    // queue
    queueId: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    song: PropTypes.object,
    isPlaying: PropTypes.bool.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    viewportStyle: PropTypes.object.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    cancelStatus: PropTypes.func.isRequired,
    emitError: PropTypes.func.isRequired,
    emitLeave: PropTypes.func.isRequired,
  }

  componentDidMount () {
    // emit initial state
    this.props.emitStatus({
      isPlaying: this.props.isPlaying,
      position: 0,
      volume: this.props.volume,
    })
  }

  componentDidUpdate (prevProps) {
    this.props.emitStatus({
      isPlaying: this.props.isPlaying,
      volume: this.props.volume,
    })
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

  componentWillUnmount () {
    this.props.emitLeave()
  }

  render () {
    const { song, viewportStyle } = this.props
    const { width, height, paddingTop, paddingBottom } = viewportStyle
    let Component = 'div'
    let componentProps = {}

    if (this.props.isAtQueueEnd) {
      // show 'add more songs' placeholder
      componentProps.title = 'CAN HAZ MOAR SONGZ?'
      Component = ColorCycle
    } else if (!song) {
      // show 'press play to begin' placeholder
      componentProps.title = 'PRESS PLAY TO BEGIN'
      Component = ColorCycle
    } else if (typeof Providers[song.provider] === 'undefined') {
      // show 'provider error' placeholder
      this.props.emitError(this.props.queueId, 'No provider for type: "' + song.provider + '"')
    } else {
      Component = Providers[song.provider].playerComponent
      componentProps = {
        song,
        volume: this.props.volume,
        isPlaying: this.props.isPlaying,
        getMedia: this.props.getMedia,
        getMediaSuccess: this.props.getMediaSuccess,
        onStatus: this.props.emitStatus,
        onMediaError: this.handleError,
        onMediaEnd: this.props.requestPlayNext,
        width,
        height: height - (screenfull.isFullscreen ? 0 : paddingTop + paddingBottom),
      }
    }

    return (
      <div style={{ overflow: 'hidden' }}>
        <PlayerHeader requestFullscreen={this.handleFullscreen} />
        <div
          ref={r => { this.ref = r }}
          className={classes.container}
          style={screenfull.isFullscreen ? {} : {
            marginTop: paddingTop,
            height: height - paddingTop - paddingBottom,
          }}
        >
          <Component {...componentProps} />
        </div>
      </div>
    )
  }

  handleFullscreen = () => {
    if (screenfull.enabled) {
      screenfull.request(this.ref)
    }
  }

  handleError = (err) => {
    this.props.emitError(this.props.queueId, err)
  }
}

export default PlayerView
