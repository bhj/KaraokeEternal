import React, { PropTypes } from 'react'
import { AutoSizer } from 'react-virtualized'
import ProviderPlayers from './provider'
import screenfull from 'screenfull'

class PlayerView extends React.Component {
  static propTypes = {
    // queue
    queueId: PropTypes.number,
    song: PropTypes.object,
    isPlaying: PropTypes.bool.isRequired,
    isFinished: PropTypes.bool.isRequired,
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
      pos: 0,
      isPlaying: this.props.isPlaying,
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.isPlaying && !prevProps.isPlaying) {
      // playing for first time, after queue end, or after error
      if (this.props.queueId === -1 || this.props.isFinished || this.props.isErrored) {
        this.props.requestPlayNext()
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.props.queueId !== nextProps.queueId) {
      // cancel any throttled status updates for old id
      this.props.cancelStatus()

      // emit the new id now so "play next" feels more responsive
      this.props.emitStatus({
        queueId: nextProps.queueId,
        pos: 0,
        isPlaying: this.props.isPlaying,
      })
    }
  }

  render () {
    const song = this.props.song
    let Component = 'div'
    let componentProps

    if (this.props.isFinished) {
      // show 'add more songs' placeholder
    } else if (!song) {
      // show 'press play to begin' placeholder
    } else if (!ProviderPlayers[song.provider]) {
      // show 'provider error' placeholder
      this.props.mediaError(this.props.queueId, 'No provider for type: "'+song.provider+'"')
    } else {
      Component = ProviderPlayers[song.provider]
      componentProps = {
        queueId: this.props.queueId,
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
      <div style={{flex: '1 1 auto', width: '100%' }}
        ref={ref => {this.ref = ref}}
        onDoubleClick={this.toggleFullscreen}
      >
        <AutoSizer>
          {({width, height}) => (
            <Component width={width} height={height} {...componentProps}/>
          )}
        </AutoSizer>
      </div>
    )
  }

  toggleFullscreen() {
    screenfull.toggle(this.ref)
  }
}

export default PlayerView
