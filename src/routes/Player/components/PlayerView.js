import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import Providers from 'components/providers'
import screenfull from 'screenfull'

class PlayerView extends React.Component {
  static propTypes = {
    // queue
    queueId: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    song: PropTypes.object,
    isPlaying: PropTypes.bool.isRequired,
    isAtQueueEnd: PropTypes.bool.isRequired,
    isErrored:  PropTypes.bool.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    mediaError: PropTypes.func.isRequired,
    cancelStatus: PropTypes.func.isRequired,
    // player misc
    isFetching: PropTypes.bool.isRequired,
  }

  toggleFullscreen = this.toggleFullscreen.bind(this)

  componentDidMount() {
    // emit initial state
    this.props.emitStatus({
      queueId: this.props.queueId,
      position: 0,
      volume: this.props.volume,
      isPlaying: this.props.isPlaying,
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.isPlaying && !prevProps.isPlaying) {
      // playing for first time, after queue end, or after error
      if (this.props.queueId === -1 || this.props.isAtQueueEnd || this.props.isErrored) {
        this.props.requestPlayNext()
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // cancel any queued (throttled) updates for prev item
    if (this.props.queueId !== nextProps.queueId) {
      this.props.cancelStatus()
    }

    // cancel queued updates that would have outdated isPlaying: true
    if ((this.props.isAtQueueEnd !== nextProps.isAtQueueEnd) && nextProps.isAtQueueEnd) {
      this.props.cancelStatus()
    }
  }

  render () {
    const { song } = this.props
    let Component = 'div'
    let componentProps

    if (this.props.isAtQueueEnd) {
      // show 'add more songs' placeholder
    } else if (!song) {
      // show 'press play to begin' placeholder
    } else if (typeof Providers[song.provider] === 'undefined') {
      // show 'provider error' placeholder
      this.props.mediaError(this.props.queueId, 'No provider for type: "'+song.provider+'"')
    } else {
      Component = Providers[song.provider].playerComponent
      componentProps = {
        queueId: this.props.queueId,
        volume: this.props.volume,
        item: song,
        isPlaying: this.props.isPlaying,
        getMedia: this.props.getMedia,
        getMediaSuccess: this.props.getMediaSuccess,
        onStatus: this.props.emitStatus,
        onMediaError: this.props.mediaError,
        onMediaEnd: this.props.requestPlayNext,
      }
    }

    return (
      <AppLayout title="Player">
        {(style) => (
          <div
            ref={ref => {this.ref = ref}}
            onDoubleClick={this.toggleFullscreen}
            style={screenfull.isFullscreen ? {} : style}
            >
              <Component
                {...componentProps}
                width={style.width}
                height={style.height - (screenfull.isFullscreen ? 0 : (style.paddingTop + style.paddingBottom))}
              />
          </div>
        )}
      </AppLayout>
    )
  }

  toggleFullscreen() {
    screenfull.toggle(this.ref)
  }
}

export default PlayerView
