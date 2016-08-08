import React, { PropTypes } from 'react'
import { AutoSizer } from 'react-virtualized'
import ProviderPlayers from './provider'
import screenfull from 'screenfull'

class PlayerView extends React.Component {
  static propTypes = {
    // queue
    curId: PropTypes.number,
    item: PropTypes.object,
    isPlaying: PropTypes.bool.isRequired,
    isFinished: PropTypes.bool.isRequired,
    // actions
    requestPlayNext: PropTypes.func.isRequired,
    emitStatus: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    mediaError: PropTypes.func.isRequired,
    // player misc
    isFetching: PropTypes.bool.isRequired,
    libraryHasLoaded: PropTypes.bool.isRequired,
  }

  toggleFullscreen = this.toggleFullscreen.bind(this)

  componentDidMount() {
    // emit initial state
    this.props.emitStatus({
      curId: this.props.curId,
      curPos: 0,
      isPlaying: false,
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.item) {
      let { queueId, provider } = this.props.item

      if (prevProps.item && this.props.item && prevProps.item.queueId !== queueId && !ProviderPlayers[provider]) {
        // missing/invalid provider; trigger next track
        this.props.mediaError(id, 'No player provided for "'+provider+'"')
      }
    }

    // playing for the first time or after queue ended
    if (this.props.isPlaying && !prevProps.isPlaying && (this.props.curId === null || this.props.isFinished)) {
      // start at beginning of queue
      this.props.requestPlayNext()
    }
  }

  render () {
    let ActiveComp = 'div'
    let customProps = {}

    if (this.props.isFinished) {
      // show 'add more songs' placeholder
    } else if (!this.props.item) {
      // show 'press play to begin' placeholder
    } else if (!ProviderPlayers[this.props.item.provider]) {
      // show 'provider error' placeholder
    } else {
      ActiveComp = ProviderPlayers[this.props.item.provider]
      customProps = {
          item: this.props.item,
          isPlaying: this.props.isPlaying,
          getMedia: this.props.getMedia,
          getMediaSuccess: this.props.getMediaSuccess,
          onStatus: this.props.emitStatus,
          onMediaError: this.props.mediaError,
          onMediaEnd: this.props.requestPlayNext
      }
    }

    return (
      <div style={{flex: '1 1 auto', width: '100%' }}
        ref={ref => {this.ref = ref}}
        onClick={this.toggleFullscreen}
      >
        <AutoSizer>
          {({width, height}) => (
            <ActiveComp width={width} height={height} {...customProps}/>
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
