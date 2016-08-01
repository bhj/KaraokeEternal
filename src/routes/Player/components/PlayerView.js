import React, { PropTypes } from 'react'
import { AutoSizer } from 'react-virtualized'
import ProviderPlayers from './provider'

class PlayerView extends React.Component {
  static propTypes = {
    // queue
    curId: PropTypes.number,
    item: PropTypes.object,
    isPlaying: PropTypes.bool.isRequired,
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

    // detect playing for the first time
    if (!this.props.item && this.props.isPlaying && this.props.isPlaying !== prevProps.isPlaying) {
      // start at beginning of queue
      this.props.requestPlayNext()
    }
  }

  render () {
    if (!this.props.item || !ProviderPlayers[this.props.item.provider]) {
      return null
    }

    const Player = ProviderPlayers[this.props.item.provider]

    return (
      <AutoSizer>
        {({ height, width }) => (
          <Player
            width={width}
            height={height}
            item={this.props.item}
            isPlaying={this.props.isPlaying}
            getMedia={this.props.getMedia}
            getMediaSuccess={this.props.getMediaSuccess}
            onStatus={this.props.emitStatus}
            onMediaError={this.props.mediaError}
            onMediaEnd={this.props.requestPlayNext}
          />
        )}
      </AutoSizer>
    )
  }
}

export default PlayerView
