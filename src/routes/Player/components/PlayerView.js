import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
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
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    cancelStatus: PropTypes.func.isRequired,
    emitError: PropTypes.func.isRequired,
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
    if (this.props.isPlaying && !prevProps.isPlaying) {
      // playing for first time, after queue end, or after error
      if (this.props.queueId === -1 || this.props.isAtQueueEnd || this.props.isErrored) {
        this.props.requestPlayNext()
      }
    }

    if (this.props.isAtQueueEnd && !prevProps.isAtQueueEnd) {
      this.props.emitStatus({
        isPlaying: false,
        position: 0,
        volume: this.props.volume,
      })
    }

    // if (this.props.queue !== prevProps.queue) {
    //   if (this.props.isAtQueueEnd && this.props.isPlaying) {
    //     this.props.requestPlayNext()
    //   }
    // }
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
    const { song } = this.props
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
      }
    }

    return (
      <AppLayout>
        {(style) => (
          <div style={{ overflow: 'hidden' }}>
            <PlayerHeader requestFullscreen={this.handleFullscreen} />
            <div
              ref={r => { this.ref = r }}
              className={classes.container}
              style={screenfull.isFullscreen ? {} : {
                marginTop: style.paddingTop,
                height: style.height - style.paddingTop - style.paddingBottom,
              }}
            >
              <Component
                {...componentProps}
                width={style.width}
                height={style.height - (screenfull.isFullscreen ? 0 : (style.paddingTop + style.paddingBottom))}
              />
            </div>
          </div>
        )}
      </AppLayout>
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
