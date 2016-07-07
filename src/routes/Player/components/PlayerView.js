import React, { PropTypes } from 'react'
import { AutoSizer } from 'react-virtualized'
import ProviderPlayers from './provider'

class PlayerView extends React.Component {
  static propTypes = {
    // actions
    requestPlay: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    requestPause: PropTypes.func.isRequired,
    status: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    mediaError: PropTypes.func.isRequired,
    mediaEnd: React.PropTypes.func.isRequired,
    // store state
    queue: PropTypes.object.isRequired,
    libraryHasLoaded: PropTypes.bool.isRequired,
    currentId: PropTypes.number,
    currentTime: PropTypes.number,
    isPlaying: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool.isRequired,
  }

  handleMediaError = this.handleMediaError.bind(this)

  componentDidMount() {
    // emit initial state
    this.props.status({
      currentId: null,
      currentTime: 0,
      isPlaying: false,
    })
  }

  componentDidUpdate (prevProps) {
    if (this.props.isPlaying && this.props.isPlaying !== prevProps.isPlaying) {
      if (!this.props.currentId) {
        this.props.requestPlayNext()
      }
    }
  }

  handleMediaError(id, message) {
    // notification
    this.props.mediaError(id, message)

    // since multiple errors (e.g. audio and video)
    // can occur while loading, make sure this error
    // is for the current item before we take action
    if (id === this.props.currentId) {
      this.props.requestPlayNext()
    }
  }

  render () {
    const { queue, currentId, isPlaying } = this.props
    const item = queue.entities[currentId]

    if (!currentId) {
      return null
    }

    if (!item) {
      console.log('no item with id: %s', currentId)
      return null
    }

    const Player = ProviderPlayers[item.provider]

    if (!Player) {
      // no player component for this provider (todo: better error)
      console.log('no player component for provider: %s', item.provider)
      return null
    }

    return (
      <AutoSizer>
        {({ height, width }) => (
          <Player
            width={width}
            height={height}
            item={item}
            isPlaying={this.props.isPlaying}
            getMedia={this.props.getMedia}
            getMediaSuccess={this.props.getMediaSuccess}
            onStatus={this.props.status}
            onMediaError={this.handleMediaError}
            onMediaEnd={this.props.mediaEnd}
          />
        )}
      </AutoSizer>
    )
  }
}

export default PlayerView
